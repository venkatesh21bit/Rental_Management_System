# database_optimizations.py - Production database configurations

from django.db import models
from django.core.cache import cache
from django.db.models import Q, F, Count, Sum, Avg
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)

# 1. DATABASE CONNECTION OPTIMIZATION
DATABASE_OPTIMIZATION_SETTINGS = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 600,  # Connection pooling
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'MAX_CONNS': 20,
            'MIN_CONNS': 5,
            'sslmode': 'require',
            'connect_timeout': 10,
            'command_timeout': 30,
            'server_side_binding': True,
            'application_name': 'rental_management_system',
            'options': '-c default_transaction_isolation=read_committed'
        }
    }
}

# 2. CACHING STRATEGIES
CACHE_SETTINGS = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
        },
        'KEY_PREFIX': 'rental_mgmt',
        'TIMEOUT': 300,  # 5 minutes default
    },
    'sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/2',
        'TIMEOUT': 86400,  # 24 hours
    },
    'long_term': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/3',
        'TIMEOUT': 3600,  # 1 hour
    }
}

# 3. QUERY OPTIMIZATION MIXINS
class QueryOptimizationMixin:
    """Mixin for optimized database queries"""
    
    @classmethod
    def get_optimized_queryset(cls):
        """Get queryset with optimized select_related and prefetch_related"""
        return cls.objects.select_related().prefetch_related()
    
    @classmethod
    def bulk_create_optimized(cls, objects, batch_size=1000, ignore_conflicts=False):
        """Optimized bulk create with batching"""
        return cls.objects.bulk_create(
            objects, 
            batch_size=batch_size,
            ignore_conflicts=ignore_conflicts
        )
    
    @classmethod
    def bulk_update_optimized(cls, objects, fields, batch_size=1000):
        """Optimized bulk update"""
        return cls.objects.bulk_update(objects, fields, batch_size=batch_size)

# 4. CACHING DECORATORS
def cache_result(timeout=300, key_prefix=''):
    """Decorator to cache function results"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator

# 5. DATABASE INDEXING STRATEGIES
class IndexOptimizedModel(models.Model):
    """Base model with optimized indexing"""
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['updated_at']),
        ]
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

# 6. QUERY PERFORMANCE MONITORING
class QueryPerformanceMiddleware:
    """Middleware to monitor query performance"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        from django.db import connection
        from django.conf import settings
        
        # Start monitoring
        initial_queries = len(connection.queries)
        
        response = self.get_response(request)
        
        # Log slow queries in development
        if settings.DEBUG:
            query_count = len(connection.queries) - initial_queries
            if query_count > 10:  # More than 10 queries
                logger.warning(f"High query count: {query_count} for {request.path}")
            
            # Log slow queries
            for query in connection.queries[initial_queries:]:
                query_time = float(query['time'])
                if query_time > 0.5:  # Slower than 500ms
                    logger.warning(f"Slow query ({query_time}s): {query['sql'][:100]}...")
        
        return response

# 7. ADVANCED CACHING MANAGER
class CacheManager:
    """Advanced cache management utilities"""
    
    @staticmethod
    def cache_queryset(queryset, cache_key, timeout=300):
        """Cache queryset results"""
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        results = list(queryset)
        cache.set(cache_key, results, timeout)
        return results
    
    @staticmethod
    def invalidate_model_cache(model_name, obj_id=None):
        """Invalidate cache for specific model or instance"""
        if obj_id:
            cache_pattern = f"{model_name}:{obj_id}:*"
        else:
            cache_pattern = f"{model_name}:*"
        
        # Delete cache keys matching pattern
        cache.delete_many(cache.keys(cache_pattern))
    
    @staticmethod
    def warm_cache():
        """Warm up cache with frequently accessed data"""
        from apps.catalog.models import Product, Category
        from apps.orders.models import RentalOrder
        
        # Cache popular products
        popular_products = Product.objects.filter(
            is_active=True
        ).order_by('-rental_count')[:50]
        
        cache.set('popular_products', list(popular_products), 3600)
        
        # Cache categories
        categories = Category.objects.filter(is_active=True)
        cache.set('active_categories', list(categories), 3600)

# 8. DATABASE SIGNAL OPTIMIZATIONS
@receiver(post_save)
def invalidate_cache_on_save(sender, instance, **kwargs):
    """Invalidate relevant cache when model is saved"""
    model_name = sender.__name__.lower()
    CacheManager.invalidate_model_cache(model_name, instance.pk)

@receiver(post_delete)
def invalidate_cache_on_delete(sender, instance, **kwargs):
    """Invalidate relevant cache when model is deleted"""
    model_name = sender.__name__.lower()
    CacheManager.invalidate_model_cache(model_name, instance.pk)

# 9. QUERY OPTIMIZATION UTILITIES
class QueryOptimizer:
    """Utilities for query optimization"""
    
    @staticmethod
    def get_rental_orders_optimized(customer_id=None, status=None):
        """Optimized query for rental orders"""
        queryset = RentalOrder.objects.select_related(
            'customer__user',
            'delivery_location',
            'pickup_location'
        ).prefetch_related(
            'order_items__product',
            'payments',
            'delivery_documents'
        )
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-created_at')
    
    @staticmethod
    def get_product_analytics():
        """Get product analytics with optimized aggregations"""
        from apps.catalog.models import Product
        from apps.orders.models import OrderItem
        
        return Product.objects.annotate(
            total_rentals=Count('orderitem'),
            total_revenue=Sum(F('orderitem__quantity') * F('orderitem__unit_price')),
            avg_rental_duration=Avg('orderitem__rental_order__rental_days'),
            last_rented=models.Max('orderitem__rental_order__created_at')
        ).filter(
            total_rentals__gt=0
        ).order_by('-total_revenue')

# 10. DATABASE BACKUP AND MAINTENANCE
class DatabaseMaintenance:
    """Database maintenance utilities"""
    
    @staticmethod
    def analyze_query_performance():
        """Analyze query performance and suggest optimizations"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            # PostgreSQL specific queries
            cursor.execute("""
                SELECT query, mean_time, calls, total_time
                FROM pg_stat_statements
                ORDER BY total_time DESC
                LIMIT 10;
            """)
            
            slow_queries = cursor.fetchall()
            return slow_queries
    
    @staticmethod
    def get_database_stats():
        """Get database statistics"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation
                FROM pg_stats
                WHERE schemaname = 'public'
                ORDER BY tablename, attname;
            """)
            
            return cursor.fetchall()
    
    @staticmethod
    def suggest_indexes():
        """Suggest database indexes based on query patterns"""
        # This would analyze query logs and suggest indexes
        # Implementation depends on your specific query patterns
        suggestions = []
        
        # Example suggestions based on common patterns
        suggestions.append({
            'table': 'orders_rentalorder',
            'columns': ['customer_id', 'status', 'created_at'],
            'reason': 'Frequently filtered together'
        })
        
        suggestions.append({
            'table': 'catalog_product',
            'columns': ['category_id', 'is_active'],
            'reason': 'Product listing queries'
        })
        
        return suggestions

# 11. REDIS OPTIMIZATION
REDIS_OPTIMIZATION_SETTINGS = {
    'CONNECTION_POOL_CLASS': 'redis.BlockingConnectionPool',
    'CONNECTION_POOL_CLASS_KWARGS': {
        'max_connections': 50,
        'timeout': 20,
    },
    'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
    'IGNORE_EXCEPTIONS': True,
}

# 12. DATABASE MONITORING
class DatabaseMonitor:
    """Database monitoring and alerting"""
    
    @staticmethod
    def check_connection_count():
        """Monitor database connections"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT count(*) 
                FROM pg_stat_activity 
                WHERE state = 'active';
            """)
            
            active_connections = cursor.fetchone()[0]
            
            if active_connections > 15:  # Alert threshold
                logger.warning(f"High connection count: {active_connections}")
            
            return active_connections
    
    @staticmethod
    def check_query_performance():
        """Monitor query performance"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    query,
                    mean_time,
                    calls
                FROM pg_stat_statements 
                WHERE mean_time > 1000  -- Queries taking more than 1 second
                ORDER BY mean_time DESC;
            """)
            
            slow_queries = cursor.fetchall()
            
            if slow_queries:
                logger.warning(f"Found {len(slow_queries)} slow queries")
            
            return slow_queries

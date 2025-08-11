# monitoring.py - Production monitoring and observability

import logging
import json
import time
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.core.cache import cache
from django.db import connection
from django.conf import settings
import psutil
import sys
import os

# 1. STRUCTURED LOGGING CONFIGURATION
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s',
            'class': 'pythonjsonlogger.jsonlogger.JsonFormatter',
        },
        'verbose': {
            'format': '[{asctime}] {levelname} [{name}:{lineno}] {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{asctime}] {levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file_debug': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/debug.log',
            'maxBytes': 1024*1024*50,  # 50MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'file_error': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/error.log',
            'maxBytes': 1024*1024*50,  # 50MB
            'backupCount': 10,
            'formatter': 'json',
        },
        'file_security': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/security.log',
            'maxBytes': 1024*1024*20,  # 20MB
            'backupCount': 10,
            'formatter': 'json',
        },
        'file_performance': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/performance.log',
            'maxBytes': 1024*1024*30,  # 30MB
            'backupCount': 7,
            'formatter': 'json',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file_debug'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['file_security', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file_debug', 'file_error'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'performance': {
            'handlers': ['file_performance'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['console', 'file_debug'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console', 'file_error'],
    },
}

# 2. PERFORMANCE MONITORING MIDDLEWARE
class PerformanceMonitoringMiddleware:
    """Monitor request performance and system metrics"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.performance_logger = logging.getLogger('performance')
    
    def __call__(self, request):
        start_time = time.time()
        start_queries = len(connection.queries)
        
        # Get system metrics before request
        process = psutil.Process()
        memory_before = process.memory_info().rss / 1024 / 1024  # MB
        cpu_before = process.cpu_percent()
        
        response = self.get_response(request)
        
        # Calculate metrics
        end_time = time.time()
        response_time = end_time - start_time
        query_count = len(connection.queries) - start_queries
        
        # Get system metrics after request
        memory_after = process.memory_info().rss / 1024 / 1024  # MB
        cpu_after = process.cpu_percent()
        
        # Log performance metrics
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'response_time_ms': round(response_time * 1000, 2),
            'query_count': query_count,
            'memory_usage_mb': round(memory_after, 2),
            'memory_delta_mb': round(memory_after - memory_before, 2),
            'cpu_usage_percent': cpu_after,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:100],
            'client_ip': self.get_client_ip(request),
        }
        
        # Log slow requests
        if response_time > 2.0:  # Slower than 2 seconds
            metrics['alert'] = 'SLOW_REQUEST'
            self.performance_logger.warning(f"Slow request: {json.dumps(metrics)}")
        
        # Log high query count
        if query_count > 20:
            metrics['alert'] = 'HIGH_QUERY_COUNT'
            self.performance_logger.warning(f"High query count: {json.dumps(metrics)}")
        
        # Log normal performance
        self.performance_logger.info(json.dumps(metrics))
        
        # Add performance headers
        response['X-Response-Time'] = f"{response_time:.3f}s"
        response['X-Query-Count'] = str(query_count)
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

# 3. SYSTEM HEALTH MONITORING
class SystemHealthMonitor:
    """Monitor system health and resources"""
    
    def __init__(self):
        self.health_logger = logging.getLogger('performance')
    
    def get_system_metrics(self):
        """Get comprehensive system metrics"""
        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        
        # Memory metrics
        memory = psutil.virtual_memory()
        
        # Disk metrics
        disk = psutil.disk_usage('/')
        
        # Network metrics (if available)
        try:
            network = psutil.net_io_counters()
            network_metrics = {
                'bytes_sent': network.bytes_sent,
                'bytes_recv': network.bytes_recv,
                'packets_sent': network.packets_sent,
                'packets_recv': network.packets_recv,
            }
        except:
            network_metrics = {}
        
        return {
            'timestamp': datetime.now().isoformat(),
            'cpu': {
                'percent': cpu_percent,
                'count': cpu_count,
            },
            'memory': {
                'total_gb': round(memory.total / (1024**3), 2),
                'available_gb': round(memory.available / (1024**3), 2),
                'used_gb': round(memory.used / (1024**3), 2),
                'percent': memory.percent,
            },
            'disk': {
                'total_gb': round(disk.total / (1024**3), 2),
                'free_gb': round(disk.free / (1024**3), 2),
                'used_gb': round(disk.used / (1024**3), 2),
                'percent': round((disk.used / disk.total) * 100, 2),
            },
            'network': network_metrics,
        }
    
    def get_database_metrics(self):
        """Get database performance metrics"""
        with connection.cursor() as cursor:
            # Connection count
            cursor.execute("""
                SELECT count(*) as active_connections
                FROM pg_stat_activity 
                WHERE state = 'active';
            """)
            active_connections = cursor.fetchone()[0]
            
            # Database size
            cursor.execute("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;
            """)
            db_size = cursor.fetchone()[0]
            
            # Slow queries (if pg_stat_statements is enabled)
            try:
                cursor.execute("""
                    SELECT count(*) as slow_queries
                    FROM pg_stat_statements 
                    WHERE mean_time > 1000;
                """)
                slow_queries = cursor.fetchone()[0]
            except:
                slow_queries = 0
            
            return {
                'active_connections': active_connections,
                'database_size': db_size,
                'slow_queries': slow_queries,
            }
    
    def get_application_metrics(self):
        """Get application-specific metrics"""
        from apps.orders.models import RentalOrder
        from apps.accounts.models import UserProfile
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Get counts for last 24 hours
        yesterday = datetime.now() - timedelta(days=1)
        
        return {
            'users': {
                'total': User.objects.count(),
                'active_last_24h': User.objects.filter(last_login__gte=yesterday).count(),
                'new_last_24h': User.objects.filter(date_joined__gte=yesterday).count(),
            },
            'orders': {
                'total': RentalOrder.objects.count(),
                'pending': RentalOrder.objects.filter(status='pending').count(),
                'active': RentalOrder.objects.filter(status='active').count(),
                'new_last_24h': RentalOrder.objects.filter(created_at__gte=yesterday).count(),
            },
            'cache': {
                'redis_connected': self.check_redis_connection(),
            }
        }
    
    def check_redis_connection(self):
        """Check Redis connection status"""
        try:
            cache.get('health_check')
            return True
        except:
            return False
    
    def check_celery_status(self):
        """Check Celery worker status"""
        from celery import current_app
        
        try:
            inspect = current_app.control.inspect()
            stats = inspect.stats()
            return {
                'workers_active': len(stats) if stats else 0,
                'workers_online': bool(stats),
            }
        except:
            return {
                'workers_active': 0,
                'workers_online': False,
            }
    
    def generate_health_report(self):
        """Generate comprehensive health report"""
        try:
            system_metrics = self.get_system_metrics()
            db_metrics = self.get_database_metrics()
            app_metrics = self.get_application_metrics()
            celery_status = self.check_celery_status()
            
            health_report = {
                'timestamp': datetime.now().isoformat(),
                'status': 'healthy',
                'system': system_metrics,
                'database': db_metrics,
                'application': app_metrics,
                'celery': celery_status,
                'alerts': []
            }
            
            # Check for alerts
            if system_metrics['cpu']['percent'] > 80:
                health_report['alerts'].append('HIGH_CPU_USAGE')
                health_report['status'] = 'warning'
            
            if system_metrics['memory']['percent'] > 85:
                health_report['alerts'].append('HIGH_MEMORY_USAGE')
                health_report['status'] = 'warning'
            
            if db_metrics['active_connections'] > 15:
                health_report['alerts'].append('HIGH_DB_CONNECTIONS')
                health_report['status'] = 'warning'
            
            if not celery_status['workers_online']:
                health_report['alerts'].append('CELERY_WORKERS_DOWN')
                health_report['status'] = 'critical'
            
            # Log health report
            if health_report['alerts']:
                self.health_logger.warning(f"Health Alert: {json.dumps(health_report)}")
            else:
                self.health_logger.info(f"Health Check: {json.dumps(health_report)}")
            
            return health_report
            
        except Exception as e:
            error_report = {
                'timestamp': datetime.now().isoformat(),
                'status': 'error',
                'error': str(e),
                'alerts': ['HEALTH_CHECK_FAILED']
            }
            self.health_logger.error(f"Health check failed: {json.dumps(error_report)}")
            return error_report

# 4. ALERTING SYSTEM
class AlertManager:
    """Manage alerts and notifications"""
    
    def __init__(self):
        self.alert_thresholds = {
            'cpu_usage': 80,
            'memory_usage': 85,
            'disk_usage': 90,
            'response_time': 5.0,
            'error_rate': 0.05,  # 5%
            'db_connections': 15,
        }
        
        self.alert_cooldown = 300  # 5 minutes
    
    def check_alerts(self, metrics):
        """Check if any metrics exceed thresholds"""
        alerts = []
        
        # CPU usage alert
        if metrics.get('system', {}).get('cpu', {}).get('percent', 0) > self.alert_thresholds['cpu_usage']:
            alerts.append({
                'type': 'HIGH_CPU_USAGE',
                'value': metrics['system']['cpu']['percent'],
                'threshold': self.alert_thresholds['cpu_usage'],
                'severity': 'warning'
            })
        
        # Memory usage alert
        memory_percent = metrics.get('system', {}).get('memory', {}).get('percent', 0)
        if memory_percent > self.alert_thresholds['memory_usage']:
            alerts.append({
                'type': 'HIGH_MEMORY_USAGE',
                'value': memory_percent,
                'threshold': self.alert_thresholds['memory_usage'],
                'severity': 'warning'
            })
        
        # Database connections alert
        db_connections = metrics.get('database', {}).get('active_connections', 0)
        if db_connections > self.alert_thresholds['db_connections']:
            alerts.append({
                'type': 'HIGH_DB_CONNECTIONS',
                'value': db_connections,
                'threshold': self.alert_thresholds['db_connections'],
                'severity': 'warning'
            })
        
        return alerts
    
    def send_alert(self, alert):
        """Send alert notification"""
        # Check cooldown
        cache_key = f"alert_cooldown:{alert['type']}"
        if cache.get(cache_key):
            return  # Alert already sent recently
        
        # Log alert
        alert_logger = logging.getLogger('performance')
        alert_logger.critical(f"ALERT: {json.dumps(alert)}")
        
        # Set cooldown
        cache.set(cache_key, True, self.alert_cooldown)
        
        # Send notification (email, webhook, etc.)
        self.send_notification(alert)
    
    def send_notification(self, alert):
        """Send notification via various channels"""
        # Email notification
        if hasattr(settings, 'ALERT_EMAIL_RECIPIENTS'):
            self.send_email_alert(alert)
        
        # Webhook notification
        if hasattr(settings, 'ALERT_WEBHOOK_URL'):
            self.send_webhook_alert(alert)
    
    def send_email_alert(self, alert):
        """Send email alert"""
        from django.core.mail import send_mail
        
        subject = f"[ALERT] {alert['type']} - {alert['severity'].upper()}"
        message = f"""
        Alert Type: {alert['type']}
        Severity: {alert['severity']}
        Current Value: {alert['value']}
        Threshold: {alert['threshold']}
        Timestamp: {datetime.now().isoformat()}
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                settings.ALERT_EMAIL_RECIPIENTS,
                fail_silently=False,
            )
        except Exception as e:
            logging.error(f"Failed to send email alert: {e}")
    
    def send_webhook_alert(self, alert):
        """Send webhook alert"""
        import requests
        
        payload = {
            'alert_type': alert['type'],
            'severity': alert['severity'],
            'value': alert['value'],
            'threshold': alert['threshold'],
            'timestamp': datetime.now().isoformat(),
            'service': 'rental_management_system'
        }
        
        try:
            response = requests.post(
                settings.ALERT_WEBHOOK_URL,
                json=payload,
                timeout=10
            )
            response.raise_for_status()
        except Exception as e:
            logging.error(f"Failed to send webhook alert: {e}")

# 5. METRICS COLLECTION COMMAND
class Command(BaseCommand):
    """Django management command for metrics collection"""
    help = 'Collect and log system metrics'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--continuous',
            action='store_true',
            help='Run continuously with intervals',
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=60,
            help='Interval in seconds for continuous monitoring',
        )
    
    def handle(self, *args, **options):
        monitor = SystemHealthMonitor()
        alert_manager = AlertManager()
        
        if options['continuous']:
            self.stdout.write('Starting continuous monitoring...')
            try:
                while True:
                    health_report = monitor.generate_health_report()
                    
                    # Check for alerts
                    alerts = alert_manager.check_alerts(health_report)
                    for alert in alerts:
                        alert_manager.send_alert(alert)
                    
                    time.sleep(options['interval'])
            except KeyboardInterrupt:
                self.stdout.write('Monitoring stopped.')
        else:
            health_report = monitor.generate_health_report()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Health check completed. Status: {health_report['status']}"
                )
            )

# 6. REAL-TIME DASHBOARD DATA
class DashboardMetrics:
    """Provide real-time metrics for monitoring dashboard"""
    
    @staticmethod
    def get_realtime_metrics():
        """Get metrics for real-time dashboard"""
        monitor = SystemHealthMonitor()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'system': monitor.get_system_metrics(),
            'database': monitor.get_database_metrics(),
            'application': monitor.get_application_metrics(),
            'celery': monitor.check_celery_status(),
        }
    
    @staticmethod
    def get_historical_metrics(hours=24):
        """Get historical metrics from logs"""
        # This would parse log files or query a metrics database
        # For now, return sample data structure
        return {
            'cpu_usage': [],
            'memory_usage': [],
            'response_times': [],
            'error_rates': [],
            'request_counts': [],
        }

# 7. ERROR TRACKING
class ErrorTracker:
    """Track and analyze errors"""
    
    @staticmethod
    def log_error(exception, request=None, extra_data=None):
        """Log error with context"""
        error_data = {
            'timestamp': datetime.now().isoformat(),
            'error_type': type(exception).__name__,
            'error_message': str(exception),
            'traceback': sys.exc_info(),
        }
        
        if request:
            error_data.update({
                'request_path': request.path,
                'request_method': request.method,
                'user_id': request.user.id if request.user.is_authenticated else None,
                'client_ip': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT'),
            })
        
        if extra_data:
            error_data['extra'] = extra_data
        
        error_logger = logging.getLogger('apps')
        error_logger.error(json.dumps(error_data))
        
        return error_data

# 8. PERFORMANCE PROFILING
class PerformanceProfiler:
    """Profile application performance"""
    
    def __init__(self):
        self.profile_data = {}
    
    def profile_function(self, func_name):
        """Decorator to profile function execution"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                start_time = time.time()
                
                try:
                    result = func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    
                    # Store profile data
                    if func_name not in self.profile_data:
                        self.profile_data[func_name] = []
                    
                    self.profile_data[func_name].append({
                        'execution_time': execution_time,
                        'timestamp': datetime.now().isoformat(),
                        'success': True,
                    })
                    
                    return result
                    
                except Exception as e:
                    execution_time = time.time() - start_time
                    
                    self.profile_data[func_name].append({
                        'execution_time': execution_time,
                        'timestamp': datetime.now().isoformat(),
                        'success': False,
                        'error': str(e),
                    })
                    
                    raise
            
            return wrapper
        return decorator
    
    def get_performance_summary(self):
        """Get performance summary"""
        summary = {}
        
        for func_name, executions in self.profile_data.items():
            if not executions:
                continue
            
            execution_times = [ex['execution_time'] for ex in executions if ex['success']]
            
            if execution_times:
                summary[func_name] = {
                    'total_calls': len(executions),
                    'successful_calls': len(execution_times),
                    'avg_execution_time': sum(execution_times) / len(execution_times),
                    'min_execution_time': min(execution_times),
                    'max_execution_time': max(execution_times),
                    'error_rate': (len(executions) - len(execution_times)) / len(executions),
                }
        
        return summary

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from .models import ProductCategory, Product, ProductImage, ProductItem
from .serializers import (
    ProductCategorySerializer, ProductSerializer, ProductListSerializer,
    ProductCreateUpdateSerializer, ProductImageSerializer, ProductItemSerializer,
    ProductAvailabilitySerializer, ProductSearchSerializer, BulkProductUpdateSerializer
)


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list':
            # Only show top-level categories by default
            parent_id = self.request.query_params.get('parent')
            if parent_id:
                queryset = queryset.filter(parent_id=parent_id)
            else:
                queryset = queryset.filter(parent=None)
        
        # Filter active categories for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset.order_by('name')
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get complete category tree"""
        categories = ProductCategory.objects.filter(
            parent=None, is_active=True
        ).prefetch_related('children__children')
        
        serializer = self.get_serializer(categories, many=True)
        return Response({
            'success': True,
            'data': {
                'categories': serializer.data
            }
        })
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get products in this category"""
        category = self.get_object()
        products = Product.objects.filter(
            category=category,
            is_active=True,
            rentable=True
        )
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = min(int(request.query_params.get('limit', 20)), 100)
        offset = (page - 1) * limit
        
        total = products.count()
        products_page = products[offset:offset + limit]
        
        serializer = ProductListSerializer(products_page, many=True)
        
        return Response({
            'success': True,
            'data': {
                'products': serializer.data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'total_pages': (total + limit - 1) // limit,
                    'has_next': offset + limit < total,
                    'has_prev': page > 1
                }
            }
        })


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('category').prefetch_related('images', 'items')
        
        # Filter active products for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def list(self, request):
        """Get products with filtering and pagination"""
        queryset = self.get_queryset()
        
        # Search and filtering
        search = request.query_params.get('search')
        category = request.query_params.get('category')
        is_rentable = request.query_params.get('is_rentable')
        availability = request.query_params.get('availability')
        brand = request.query_params.get('brand')
        sort_by = request.query_params.get('sort_by', 'name')
        sort_order = request.query_params.get('sort_order', 'asc')
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(sku__icontains=search) |
                Q(brand__icontains=search)
            )
        
        if category:
            queryset = queryset.filter(category_id=category)
        
        if is_rentable is not None:
            queryset = queryset.filter(rentable=is_rentable.lower() == 'true')
        
        if availability is not None and availability.lower() == 'true':
            queryset = queryset.filter(
                quantity_on_hand__gt=models.F('quantity_reserved') + models.F('quantity_rented')
            )
        
        if brand:
            queryset = queryset.filter(brand__icontains=brand)
        
        # Sorting
        if sort_order == 'desc':
            sort_by = f'-{sort_by}'
        
        if sort_by in ['name', '-name', 'brand', '-brand', 'created_at', '-created_at']:
            queryset = queryset.order_by(sort_by)
        elif sort_by in ['category', '-category']:
            queryset = queryset.order_by(f'{sort_by.replace("category", "category__name")}')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = min(int(request.query_params.get('limit', 20)), 100)
        offset = (page - 1) * limit
        
        total = queryset.count()
        products_page = queryset[offset:offset + limit]
        
        serializer = self.get_serializer(products_page, many=True)
        
        return Response({
            'success': True,
            'data': {
                'products': serializer.data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'total_pages': (total + limit - 1) // limit,
                    'has_next': offset + limit < total,
                    'has_prev': page > 1
                }
            }
        })
    
    def retrieve(self, request, pk=None):
        """Get single product with availability info"""
        product = self.get_object()
        serializer = self.get_serializer(product)
        
        # Check availability for next 30 days
        from apps.orders.services import AvailabilityService
        
        start_date = datetime.now()
        end_date = start_date + timedelta(days=30)
        
        availability_info = {
            'is_available': product.is_available,
            'available_quantity': product.available_quantity,
            'next_available_date': None,
            'unavailable_dates': []
        }
        
        if product.is_available:
            calendar = AvailabilityService.get_product_calendar(
                str(product.id), start_date, end_date
            )
            
            # Find unavailable dates
            for date_info in calendar:
                if date_info['available_quantity'] == 0:
                    availability_info['unavailable_dates'].append(date_info['date'])
        
        return Response({
            'success': True,
            'data': {
                'product': serializer.data,
                'availability': availability_info
            }
        })
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Check product availability for specific date range"""
        product = self.get_object()
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        quantity = int(request.query_params.get('quantity', 1))
        
        if not start_date or not end_date:
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_PARAMETERS',
                    'message': 'start_date and end_date are required'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            from apps.orders.services import AvailabilityService
            
            availability = AvailabilityService.check_availability(
                str(product.id), start_dt, end_dt, quantity
            )
            
            return Response({
                'success': True,
                'data': availability
            })
            
        except ValueError as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_DATE_FORMAT',
                    'message': 'Invalid date format. Use ISO format.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'AVAILABILITY_CHECK_FAILED',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all product categories"""
        categories = ProductCategory.objects.filter(is_active=True).values_list('name', flat=True)
        
        return Response({
            'success': True,
            'data': {
                'categories': list(categories)
            }
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def bulk_update(self, request):
        """Bulk update products (Admin only)"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BulkProductUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        products = Product.objects.filter(id__in=data['product_ids'])
        
        if data['action'] == 'activate':
            products.update(is_active=True)
            message = f"Activated {products.count()} products"
        elif data['action'] == 'deactivate':
            products.update(is_active=False)
            message = f"Deactivated {products.count()} products"
        elif data['action'] == 'update_category':
            products.update(category_id=data['category'])
            message = f"Updated category for {products.count()} products"
        
        return Response({
            'success': True,
            'message': message
        })


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        if product_id:
            return super().get_queryset().filter(product_id=product_id)
        return super().get_queryset()
    
    def perform_create(self, serializer):
        # If this is set as primary, unset other primary images for the product
        if serializer.validated_data.get('is_primary'):
            ProductImage.objects.filter(
                product=serializer.validated_data['product'],
                is_primary=True
            ).update(is_primary=False)
        
        serializer.save()


class ProductItemViewSet(viewsets.ModelViewSet):
    queryset = ProductItem.objects.all()
    serializer_class = ProductItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('product')
        
        # Filter by product if specified
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by status if specified
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('serial_number')
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available items for rental"""
        queryset = self.get_queryset().filter(
            status=ProductItem.Status.AVAILABLE,
            condition_rating__gte=6
        )
        
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': {
                'items': serializer.data
            }
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update item status"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        item = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status not in [choice[0] for choice in ProductItem.Status.choices]:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_STATUS',
                    'message': 'Invalid status'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        item.status = new_status
        if notes:
            item.condition_notes = notes
        item.save()
        
        return Response({
            'success': True,
            'message': 'Item status updated successfully'
        })


class InventoryViewSet(viewsets.ViewSet):
    """Inventory management endpoints"""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get inventory status"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        products = Product.objects.filter(is_active=True).select_related('category')
        
        # Filtering
        product_id = request.query_params.get('product_id')
        category = request.query_params.get('category')
        inventory_status = request.query_params.get('status')
        
        if product_id:
            products = products.filter(id=product_id)
        
        if category:
            products = products.filter(category__name__icontains=category)
        
        if inventory_status == 'available':
            products = products.filter(
                quantity_on_hand__gt=models.F('quantity_reserved') + models.F('quantity_rented')
            )
        elif inventory_status == 'rented':
            products = products.filter(quantity_rented__gt=0)
        elif inventory_status == 'maintenance':
            # This would need to be implemented with ProductItem status tracking
            pass
        
        serializer = ProductListSerializer(products, many=True)
        
        return Response({
            'success': True,
            'data': {
                'inventory': serializer.data
            }
        })
    
    @action(detail=False, methods=['put'])
    def update_status(self, request):
        """Update product inventory status"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        product_id = request.data.get('product_id')
        inventory_status = request.data.get('status')
        quantity = request.data.get('quantity')
        notes = request.data.get('notes', '')
        
        try:
            product = Product.objects.get(id=product_id)
            
            if inventory_status == 'available':
                # Reset to available - this is simplified
                product.quantity_on_hand = quantity or product.quantity_on_hand
                product.quantity_reserved = 0
                product.quantity_rented = 0
            
            if notes:
                product.condition_notes = notes
            
            product.save()
            
            return Response({
                'success': True,
                'message': 'Inventory status updated successfully'
            })
            
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'PRODUCT_NOT_FOUND',
                    'message': 'Product not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Get low stock and maintenance alerts"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Low stock alerts (less than 10% available)
        low_stock = Product.objects.filter(
            is_active=True,
            quantity_on_hand__lte=models.F('quantity_reserved') + models.F('quantity_rented') + 2
        )
        
        # Maintenance alerts (items due for service)
        from datetime import date
        maintenance_due = ProductItem.objects.filter(
            next_service_date__lte=date.today(),
            status__in=[ProductItem.Status.AVAILABLE, ProductItem.Status.RENTED]
        )
        
        return Response({
            'success': True,
            'data': {
                'low_stock': ProductListSerializer(low_stock, many=True).data,
                'maintenance_due': ProductItemSerializer(maintenance_due, many=True).data
            }
        })

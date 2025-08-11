from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import datetime

from .models import (
    PriceList, PriceRule, LateFeeRule
)
from .serializers import (
    PriceListSerializer, PricingRuleSerializer,
    LateFeeSerializer, PriceCalculationRequestSerializer, PriceCalculationResponseSerializer,
    LateFeeCalculationRequestSerializer, LateFeeCalculationResponseSerializer,
    BulkPriceUpdateSerializer
)
from .services import PricingService


class PriceListViewSet(viewsets.ModelViewSet):
    queryset = PriceList.objects.all()
    serializer_class = PriceListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by customer segment
        segment = self.request.query_params.get('segment')
        if segment:
            queryset = queryset.filter(customer_segment=segment)
        
        # Only show active price lists for non-staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset.order_by('-is_default', 'name')
    
    def create(self, request):
        """Create new pricelist (Admin only)"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # If this is set as default, unset other defaults
            if serializer.validated_data.get('is_default'):
                PriceList.objects.filter(is_default=True).update(is_default=False)
            
            pricelist = serializer.save()
            
            # Create price list items if provided
            items_data = request.data.get('rules', [])
            for item_data in items_data:
                PriceListItem.objects.create(
                    price_list=pricelist,
                    product_id=item_data['product_id'],
                    price=item_data['price'],
                    rental_unit=item_data.get('rental_unit', 'DAY'),
                    min_duration=item_data.get('min_duration', 1),
                    max_duration=item_data.get('max_duration'),
                    effective_from=item_data.get('effective_from', pricelist.effective_from),
                    effective_to=item_data.get('effective_to', pricelist.effective_to)
                )
            
            return Response({
                'success': True,
                'message': 'Price list created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_items(self, request, pk=None):
        """Add items to price list"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        pricelist = self.get_object()
        items_data = request.data.get('items', [])
        
        created_items = []
        for item_data in items_data:
            serializer = PriceListItemSerializer(data={
                **item_data,
                'price_list': pricelist.id
            })
            if serializer.is_valid():
                item = serializer.save(price_list=pricelist)
                created_items.append(PriceListItemSerializer(item).data)
            else:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Invalid item data',
                        'details': serializer.errors
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': f'Added {len(created_items)} items to price list',
            'data': {
                'items': created_items
            }
        })
    
    @action(detail=True, methods=['post'])
    def bulk_update_prices(self, request, pk=None):
        """Bulk update prices in price list"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        pricelist = self.get_object()
        serializer = BulkPriceUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        updates = serializer.validated_data['updates']
        updated_count = 0
        
        for update in updates:
            try:
                item = PriceListItem.objects.get(
                    price_list=pricelist,
                    product_id=update['product_id']
                )
                item.price = update['price']
                if 'rental_unit' in update:
                    item.rental_unit = update['rental_unit']
                item.save()
                updated_count += 1
            except PriceListItem.DoesNotExist:
                # Create new item if it doesn't exist
                PriceListItem.objects.create(
                    price_list=pricelist,
                    product_id=update['product_id'],
                    price=update['price'],
                    rental_unit=update.get('rental_unit', 'DAY')
                )
                updated_count += 1
        
        return Response({
            'success': True,
            'message': f'Updated {updated_count} price items'
        })


class PricingRuleViewSet(viewsets.ModelViewSet):
    queryset = PricingRule.objects.all()
    serializer_class = PricingRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]  # Add admin check in production


class SeasonalPricingViewSet(viewsets.ModelViewSet):
    queryset = SeasonalPricing.objects.all()
    serializer_class = SeasonalPricingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by product if specified
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by date range
        date_filter = self.request.query_params.get('date')
        if date_filter:
            try:
                filter_date = datetime.fromisoformat(date_filter).date()
                queryset = queryset.filter(
                    start_date__lte=filter_date,
                    end_date__gte=filter_date,
                    is_active=True
                )
            except ValueError:
                pass
        
        return queryset.order_by('start_date')


class VolumeDiscountViewSet(viewsets.ModelViewSet):
    queryset = VolumeDiscount.objects.all()
    serializer_class = VolumeDiscountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by product if specified
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Only show active discounts for non-staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset.order_by('min_quantity')


class LoyaltyDiscountViewSet(viewsets.ModelViewSet):
    queryset = LoyaltyDiscount.objects.all()
    serializer_class = LoyaltyDiscountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by customer for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user, is_active=True)
        
        return queryset.order_by('-created_at')


class LateFeeViewSet(viewsets.ModelViewSet):
    queryset = LateFee.objects.all()
    serializer_class = LateFeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by product if specified
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset.filter(is_active=True)


class PricingViewSet(viewsets.ViewSet):
    """Pricing calculation endpoints"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def calculate(self, request):
        """Calculate pricing for products and duration"""
        product_id = request.query_params.get('product_id')
        quantity = int(request.query_params.get('quantity', 1))
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        customer_id = request.query_params.get('customer_id')
        rental_unit = request.query_params.get('rental_unit', 'DAY')
        
        if not all([product_id, start_date, end_date]):
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_PARAMETERS',
                    'message': 'product_id, start_date, and end_date are required'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            
            pricing_service = PricingService()
            result = pricing_service.calculate_product_price(
                product_id=product_id,
                quantity=quantity,
                start_date=start_dt,
                end_date=end_dt,
                customer_id=customer_id,
                rental_unit=rental_unit
            )
            
            return Response({
                'success': True,
                'data': result
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
                    'code': 'PRICING_CALCULATION_FAILED',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def batch_calculate(self, request):
        """Calculate pricing for multiple items"""
        items = request.data.get('items', [])
        customer_id = request.data.get('customer_id')
        
        if not items:
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_PARAMETERS',
                    'message': 'items list is required'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pricing_service = PricingService()
            results = []
            
            for item in items:
                start_dt = datetime.fromisoformat(item['start_date'].replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(item['end_date'].replace('Z', '+00:00'))
                
                result = pricing_service.calculate_product_price(
                    product_id=item['product_id'],
                    quantity=item.get('quantity', 1),
                    start_date=start_dt,
                    end_date=end_dt,
                    customer_id=customer_id,
                    rental_unit=item.get('rental_unit', 'DAY')
                )
                results.append(result)
            
            # Calculate totals
            total_subtotal = sum(r['subtotal'] for r in results)
            total_tax = sum(r['tax_amount'] for r in results)
            total_amount = sum(r['total_amount'] for r in results)
            
            return Response({
                'success': True,
                'data': {
                    'items': results,
                    'totals': {
                        'subtotal': total_subtotal,
                        'tax_amount': total_tax,
                        'total_amount': total_amount,
                        'currency': results[0]['currency'] if results else 'INR'
                    }
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'BATCH_PRICING_FAILED',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def calculate_late_fee(self, request):
        """Calculate late fees for overdue returns"""
        serializer = LateFeeCalculationRequestSerializer(data=request.data)
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
        
        try:
            pricing_service = PricingService()
            result = pricing_service.calculate_late_fee(
                product_id=str(data['product_id']),
                return_due_date=data['return_due_date'],
                actual_return_date=data['actual_return_date'],
                quantity=data['quantity']
            )
            
            return Response({
                'success': True,
                'data': result
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'LATE_FEE_CALCULATION_FAILED',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def customer_discounts(self, request):
        """Get applicable discounts for customer"""
        customer_id = request.query_params.get('customer_id', request.user.id)
        
        # Get loyalty discounts
        loyalty_discounts = LoyaltyDiscount.objects.filter(
            customer_id=customer_id,
            is_active=True
        )
        
        # Get volume discounts (general)
        volume_discounts = VolumeDiscount.objects.filter(
            is_active=True,
            product__isnull=True,  # General discounts
            category__isnull=True
        )
        
        return Response({
            'success': True,
            'data': {
                'loyalty_discounts': LoyaltyDiscountSerializer(loyalty_discounts, many=True).data,
                'volume_discounts': VolumeDiscountSerializer(volume_discounts, many=True).data
            }
        })

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
    PriceListSerializer, PricingRuleSerializer, LateFeeSerializer,
    PriceCalculationRequestSerializer, PriceCalculationResponseSerializer,
)

try:
    from .services import PricingService
    pricing_service = PricingService()
except ImportError:
    pricing_service = None


class PriceListViewSet(viewsets.ModelViewSet):
    queryset = PriceList.objects.all()
    serializer_class = PriceListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Only show active price lists for non-staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return []  # Public access for price lists
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate/deactivate a price list"""
        pricelist = self.get_object()
        action_type = request.data.get('action', 'activate')
        
        if action_type == 'activate':
            pricelist.is_active = True
            pricelist.save()
            message = 'Price list activated successfully'
        else:
            pricelist.is_active = False
            pricelist.save()
            message = 'Price list deactivated successfully'
        
        return Response({
            'success': True,
            'message': message,
            'data': self.get_serializer(pricelist).data
        })


class PricingRuleViewSet(viewsets.ModelViewSet):
    queryset = PriceRule.objects.all()
    serializer_class = PricingRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]  # Add staff check in production


class LateFeeViewSet(viewsets.ModelViewSet):
    queryset = LateFeeRule.objects.all()
    serializer_class = LateFeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return LateFeeRule.objects.filter(is_active=True)


class PricingViewSet(viewsets.ViewSet):
    """Pricing calculation endpoints"""
    permission_classes = []  # Public access for pricing calculations
    
    @action(detail=False, methods=['get', 'post'])
    def calculate(self, request):
        """Calculate pricing for products and duration"""
        try:
            if request.method == 'GET':
                data = request.query_params
            else:
                data = request.data
            
            # Extract parameters
            product_id = data.get('product_id')
            start_datetime = data.get('start_datetime')
            end_datetime = data.get('end_datetime')
            customer_id = data.get('customer_id')
            unit_type = data.get('unit_type', 'DAY')
            quantity = int(data.get('quantity', 1))
            
            if not all([product_id, start_datetime, end_datetime]):
                return Response({
                    'success': False,
                    'error': 'product_id, start_datetime, and end_datetime are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Use pricing service if available, otherwise basic calculation
            if pricing_service:
                result = pricing_service.calculate_product_price(
                    product_id=int(product_id),
                    start_date=start_datetime,
                    end_date=end_datetime,
                    customer_id=customer_id,
                    quantity=quantity
                )
            else:
                # Basic calculation fallback
                from apps.catalog.models import Product
                product = get_object_or_404(Product, id=product_id)
                
                # Simple daily rate calculation
                start_date = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(end_datetime.replace('Z', '+00:00'))
                days = (end_date - start_date).days or 1
                
                base_rate = product.rental_rate_per_day or 100
                total_price = base_rate * days * quantity
                
                result = {
                    'base_price': base_rate,
                    'quantity': quantity,
                    'duration_days': days,
                    'subtotal': total_price,
                    'total_price': total_price,
                    'currency': 'INR',
                    'applied_rules': []
                }
            
            return Response({
                'success': True,
                'data': result
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def batch_calculate(self, request):
        """Calculate pricing for multiple items"""
        try:
            items = request.data.get('items', [])
            if not items:
                return Response({
                    'success': False,
                    'error': 'Items array is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            results = []
            total_amount = 0
            
            for item in items:
                # Use the same calculation logic as above
                if pricing_service:
                    result = pricing_service.calculate_product_price(
                        product_id=item['product_id'],
                        start_date=item['start_datetime'],
                        end_date=item['end_datetime'],
                        customer_id=request.data.get('customer_id'),
                        quantity=item.get('quantity', 1)
                    )
                else:
                    # Basic calculation fallback
                    from apps.catalog.models import Product
                    product = get_object_or_404(Product, id=item['product_id'])
                    
                    start_date = datetime.fromisoformat(item['start_datetime'].replace('Z', '+00:00'))
                    end_date = datetime.fromisoformat(item['end_datetime'].replace('Z', '+00:00'))
                    days = (end_date - start_date).days or 1
                    quantity = item.get('quantity', 1)
                    
                    base_rate = product.rental_rate_per_day or 100
                    total_price = base_rate * days * quantity
                    
                    result = {
                        'product_id': item['product_id'],
                        'base_price': base_rate,
                        'quantity': quantity,
                        'duration_days': days,
                        'subtotal': total_price,
                        'total_price': total_price,
                        'currency': 'INR'
                    }
                
                results.append(result)
                total_amount += result.get('total_price', 0)
            
            return Response({
                'success': True,
                'data': {
                    'items': results,
                    'total_amount': total_amount,
                    'currency': 'INR'
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def calculate_late_fee(self, request):
        """Calculate late fees for overdue returns"""
        try:
            order_id = request.data.get('order_id')
            return_date = request.data.get('actual_return_date')
            
            if not all([order_id, return_date]):
                return Response({
                    'success': False,
                    'error': 'order_id and actual_return_date are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if pricing_service:
                result = pricing_service.calculate_late_fee(
                    order_id=order_id,
                    actual_return_date=return_date
                )
            else:
                # Basic late fee calculation
                from apps.orders.models import RentalOrder
                order = get_object_or_404(RentalOrder, id=order_id)
                
                expected_return = order.end_date
                actual_return = datetime.fromisoformat(return_date.replace('Z', '+00:00')).date()
                
                if actual_return > expected_return:
                    overdue_days = (actual_return - expected_return).days
                    daily_late_fee = 50  # Default late fee
                    total_late_fee = daily_late_fee * overdue_days
                    
                    result = {
                        'overdue_days': overdue_days,
                        'daily_late_fee': daily_late_fee,
                        'total_late_fee': total_late_fee,
                        'currency': 'INR'
                    }
                else:
                    result = {
                        'overdue_days': 0,
                        'total_late_fee': 0,
                        'currency': 'INR'
                    }
            
            return Response({
                'success': True,
                'data': result
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

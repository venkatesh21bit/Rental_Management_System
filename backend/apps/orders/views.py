from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from datetime import datetime, timedelta
from .models import (
    RentalQuote, QuoteItem, RentalOrder, RentalItem,
    Reservation, ReservationItem, RentalContract
)
from .serializers import (
    RentalQuoteSerializer, RentalOrderSerializer, ReservationSerializer,
    RentalContractSerializer, AvailabilitySerializer
)
from .services import AvailabilityService
from apps.pricing.services import PricingService

# Import email notification tasks
try:
    from apps.notifications.tasks import send_order_confirmation_email
except ImportError:
    send_order_confirmation_email = None


class RentalQuoteViewSet(viewsets.ModelViewSet):
    queryset = RentalQuote.objects.all()
    serializer_class = RentalQuoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by customer for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)
        return queryset.select_related('customer', 'created_by', 'price_list').prefetch_related('items__product')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def convert_to_order(self, request, pk=None):
        """Convert quote to rental order"""
        quote = self.get_object()
        
        if quote.status != RentalQuote.Status.CONFIRMED:
            return Response(
                {'error': 'Only confirmed quotes can be converted to orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Create rental order
                order = RentalOrder.objects.create(
                    quote=quote,
                    customer=quote.customer,
                    created_by=request.user,
                    rental_start=request.data.get('rental_start'),
                    rental_end=request.data.get('rental_end'),
                    price_list=quote.price_list,
                    subtotal=quote.subtotal,
                    discount_amount=quote.discount_amount,
                    tax_amount=quote.tax_amount,
                    total_amount=quote.total_amount,
                    currency=quote.currency,
                    pickup_address=request.data.get('pickup_address', ''),
                    return_address=request.data.get('return_address', ''),
                    notes=quote.notes
                )
                
                # Copy quote items to order items
                for quote_item in quote.items.all():
                    RentalItem.objects.create(
                        order=order,
                        product=quote_item.product,
                        quantity=quote_item.quantity,
                        rental_unit=quote_item.rental_unit,
                        unit_price=quote_item.unit_price,
                        discount_percent=quote_item.discount_percent,
                        discount_amount=quote_item.discount_amount,
                        line_total=quote_item.line_total,
                        start_datetime=quote_item.start_datetime,
                        end_datetime=quote_item.end_datetime,
                        notes=quote_item.notes
                    )
                
                # Check availability and create reservations
                availability_issues = []
                for order_item in order.items.all():
                    availability = AvailabilityService.check_availability(
                        str(order_item.product.id),
                        order_item.start_datetime,
                        order_item.end_datetime,
                        order_item.quantity
                    )
                    
                    if not availability['available']:
                        availability_issues.append({
                            'product': order_item.product.name,
                            'issue': f"Insufficient quantity. Available: {availability['available_quantity']}, Requested: {order_item.quantity}"
                        })
                
                if availability_issues:
                    return Response(
                        {'error': 'Availability issues', 'details': availability_issues},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create reservation
                reservation = Reservation.objects.create(
                    order=order,
                    return_due_at=order.rental_end,
                    pickup_location=order.pickup_address,
                    return_location=order.return_address
                )
                
                # Create reservation items
                for order_item in order.items.all():
                    ReservationItem.objects.create(
                        reservation=reservation,
                        product=order_item.product,
                        quantity=order_item.quantity,
                        start_datetime=order_item.start_datetime,
                        end_datetime=order_item.end_datetime
                    )
                
                order.status = RentalOrder.Status.RESERVED
                order.save()
                
                return Response({
                    'message': 'Quote converted to order successfully',
                    'order_id': str(order.id),
                    'order_number': order.order_number
                })
                
        except Exception as e:
            return Response(
                {'error': f'Failed to convert quote: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def send_quote(self, request, pk=None):
        """Send quote to customer"""
        quote = self.get_object()
        
        if quote.status != RentalQuote.Status.DRAFT:
            return Response(
                {'error': 'Only draft quotes can be sent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Here you would integrate with email service
        quote.status = RentalQuote.Status.SENT
        quote.save()
        
        return Response({'message': 'Quote sent successfully'})
    
    @action(detail=False, methods=['get'])
    def calculate_pricing(self, request):
        """Calculate pricing for quote items"""
        items_data = request.query_params.get('items', [])
        customer_id = request.query_params.get('customer_id')
        
        if not items_data:
            return Response({'error': 'Items data required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pricing_service = PricingService()
            results = []
            
            for item in items_data:
                pricing = pricing_service.calculate_product_price(
                    product_id=item['product_id'],
                    quantity=item['quantity'],
                    start_date=datetime.fromisoformat(item['start_date']),
                    end_date=datetime.fromisoformat(item['end_date']),
                    customer_id=customer_id,
                    rental_unit=item.get('rental_unit', 'DAY')
                )
                results.append(pricing)
            
            return Response({'pricing_results': results})
            
        except Exception as e:
            return Response(
                {'error': f'Pricing calculation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RentalOrderViewSet(viewsets.ModelViewSet):
    queryset = RentalOrder.objects.all()
    serializer_class = RentalOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by customer for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)
        return queryset.select_related('customer', 'created_by', 'quote', 'price_list').prefetch_related('items__product', 'reservations')
    
    def perform_create(self, serializer):
        order = serializer.save(created_by=self.request.user)
        
        # Send order confirmation email
        if send_order_confirmation_email and order.customer.email:
            send_order_confirmation_email.delay(order.id)
    
    @action(detail=True, methods=['post'])
    def confirm_pickup(self, request, pk=None):
        """Confirm item pickup"""
        order = self.get_object()
        
        if order.status not in [RentalOrder.Status.RESERVED, RentalOrder.Status.PICKUP_SCHEDULED]:
            return Response(
                {'error': 'Order must be reserved or pickup scheduled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = RentalOrder.Status.PICKED_UP
        order.actual_pickup_at = timezone.now()
        order.save()
        
        # Update reservations
        for reservation in order.reservations.all():
            reservation.status = Reservation.Status.ACTIVE
            reservation.actual_pickup_at = timezone.now()
            reservation.save()
        
        return Response({'message': 'Pickup confirmed successfully'})
    
    @action(detail=True, methods=['post'])
    def confirm_return(self, request, pk=None):
        """Confirm item return"""
        order = self.get_object()
        
        if order.status not in [RentalOrder.Status.PICKED_UP, RentalOrder.Status.ACTIVE, RentalOrder.Status.RETURN_SCHEDULED]:
            return Response(
                {'error': 'Invalid order status for return'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_condition = request.data.get('condition', 'good')
        damage_notes = request.data.get('damage_notes', '')
        
        order.status = RentalOrder.Status.RETURNED
        order.actual_return_at = timezone.now()
        order.save()
        
        # Update reservations
        for reservation in order.reservations.all():
            reservation.status = Reservation.Status.COMPLETED
            reservation.actual_return_at = timezone.now()
            reservation.save()
        
        # Calculate late fees if overdue
        if order.is_overdue:
            from apps.pricing.services import PricingService
            pricing_service = PricingService()
            
            for item in order.items.all():
                late_fee = pricing_service.calculate_late_fee(
                    str(item.product.id),
                    order.rental_end,
                    timezone.now(),
                    item.quantity
                )
                order.late_fee_amount += late_fee['total_late_fee']
            
            order.total_amount += order.late_fee_amount
            order.save()
        
        return Response({
            'message': 'Return confirmed successfully',
            'late_fee_amount': float(order.late_fee_amount),
            'condition': return_condition,
            'damage_notes': damage_notes
        })
    
    @action(detail=True, methods=['get'])
    def check_availability(self, request, pk=None):
        """Check availability for order items"""
        order = self.get_object()
        
        conflicts = AvailabilityService.check_conflicts_for_order(str(order.id))
        
        return Response(conflicts)
    
    @action(detail=False, methods=['get'])
    def overdue_orders(self, request):
        """Get list of overdue orders"""
        overdue_orders = self.get_queryset().filter(
            status__in=[
                RentalOrder.Status.PICKED_UP,
                RentalOrder.Status.ACTIVE,
                RentalOrder.Status.RETURN_SCHEDULED
            ],
            rental_end__lt=timezone.now()
        )
        
        serializer = self.get_serializer(overdue_orders, many=True)
        return Response(serializer.data)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by customer for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(order__customer=self.request.user)
        return queryset.select_related('order', 'order__customer').prefetch_related('items__product')
    
    @action(detail=False, methods=['get'])
    def upcoming_returns(self, request):
        """Get upcoming returns"""
        days_ahead = int(request.query_params.get('days', 7))
        upcoming = AvailabilityService.get_upcoming_returns(days_ahead)
        
        return Response({'upcoming_returns': upcoming})


class AvailabilityViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Check availability for multiple products"""
        return Response({'message': 'Use specific endpoints for availability checks'})
    
    @action(detail=False, methods=['post'])
    def check(self, request):
        """Check availability for specific product and period"""
        product_id = request.data.get('product_id')
        start_datetime = request.data.get('start_datetime')
        end_datetime = request.data.get('end_datetime')
        quantity = request.data.get('quantity', 1)
        
        if not all([product_id, start_datetime, end_datetime]):
            return Response(
                {'error': 'product_id, start_datetime, and end_datetime are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_dt = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_datetime.replace('Z', '+00:00'))
            
            availability = AvailabilityService.check_availability(
                product_id, start_dt, end_dt, quantity
            )
            
            return Response(availability)
            
        except Exception as e:
            return Response(
                {'error': f'Availability check failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def batch_check(self, request):
        """Check availability for multiple items"""
        items = request.data.get('items', [])
        
        if not items:
            return Response(
                {'error': 'items list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Convert datetime strings
            processed_items = []
            for item in items:
                processed_items.append({
                    'product_id': item['product_id'],
                    'start_datetime': datetime.fromisoformat(item['start_datetime'].replace('Z', '+00:00')),
                    'end_datetime': datetime.fromisoformat(item['end_datetime'].replace('Z', '+00:00')),
                    'quantity': item.get('quantity', 1)
                })
            
            results = AvailabilityService.batch_check_availability(processed_items)
            
            return Response({'results': results})
            
        except Exception as e:
            return Response(
                {'error': f'Batch availability check failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Get availability calendar for a product"""
        product_id = request.query_params.get('product_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not all([product_id, start_date, end_date]):
            return Response(
                {'error': 'product_id, start_date, and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
            
            calendar = AvailabilityService.get_product_calendar(
                product_id, start_dt, end_dt
            )
            
            return Response({'calendar': calendar})
            
        except Exception as e:
            return Response(
                {'error': f'Calendar generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def alternatives(self, request):
        """Find alternative dates if preferred dates are not available"""
        product_id = request.data.get('product_id')
        preferred_start = request.data.get('preferred_start')
        preferred_end = request.data.get('preferred_end')
        quantity = request.data.get('quantity', 1)
        search_days = request.data.get('search_days', 30)
        
        if not all([product_id, preferred_start, preferred_end]):
            return Response(
                {'error': 'product_id, preferred_start, and preferred_end are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_dt = datetime.fromisoformat(preferred_start.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(preferred_end.replace('Z', '+00:00'))
            
            alternatives = AvailabilityService.find_alternative_dates(
                product_id, start_dt, end_dt, quantity, search_days
            )
            
            return Response({'alternatives': alternatives})
            
        except Exception as e:
            return Response(
                {'error': f'Alternative date search failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RentalContractViewSet(viewsets.ModelViewSet):
    queryset = RentalContract.objects.all()
    serializer_class = RentalContractSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by customer for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(order__customer=self.request.user)
        return queryset.select_related('order', 'order__customer')
    
    @action(detail=True, methods=['post'])
    def sign_contract(self, request, pk=None):
        """Sign the rental contract"""
        contract = self.get_object()
        
        if contract.signed_at:
            return Response(
                {'error': 'Contract already signed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        signature_data = request.data.get('signature')
        
        if not signature_data:
            return Response(
                {'error': 'Signature data required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # For customer signatures
        if request.user == contract.order.customer:
            contract.customer_signature = signature_data
        # For staff signatures
        elif request.user.is_staff:
            contract.staff_signature = signature_data
        
        # If both signatures present, mark as signed
        if contract.customer_signature and contract.staff_signature:
            contract.signed_at = timezone.now()
        
        contract.save()
        
        return Response({
            'message': 'Contract signed successfully',
            'signed_at': contract.signed_at
        })

from django.db.models import Q, Sum
from django.utils import timezone
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from apps.catalog.models import Product
from apps.orders.models import RentalItem, ReservationItem


class AvailabilityService:
    """Service for checking product availability and managing reservations"""
    
    @staticmethod
    def check_availability(
        product_id: str,
        start_datetime: datetime,
        end_datetime: datetime,
        quantity: int = 1,
        exclude_order_id: Optional[str] = None
    ) -> Dict:
        """
        Check if a product is available for the specified period
        
        Returns:
        {
            'available': bool,
            'available_quantity': int,
            'total_stock': int,
            'reserved_quantity': int,
            'conflicts': List[dict]  # List of conflicting reservations
        }
        """
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return {
                'available': False,
                'available_quantity': 0,
                'total_stock': 0,
                'reserved_quantity': 0,
                'conflicts': [],
                'error': 'Product not found'
            }
        
        # Get total stock for product
        total_stock = product.stock_quantity
        
        # Find overlapping reservations
        # Two periods overlap if: NOT (end1 <= start2 OR start1 >= end2)
        # Simplified: start1 < end2 AND end1 > start2
        overlapping_reservations = ReservationItem.objects.filter(
            product_id=product_id,
            start_datetime__lt=end_datetime,
            end_datetime__gt=start_datetime,
            reservation__status__in=['RESERVED', 'ACTIVE']
        )
        
        # Exclude current order if specified (for updates)
        if exclude_order_id:
            overlapping_reservations = overlapping_reservations.exclude(
                reservation__order_id=exclude_order_id
            )
        
        # Calculate reserved quantity
        reserved_quantity = overlapping_reservations.aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        # Calculate available quantity
        available_quantity = max(0, total_stock - reserved_quantity)
        
        # Check if requested quantity is available
        is_available = available_quantity >= quantity
        
        # Get conflict details
        conflicts = []
        for res_item in overlapping_reservations:
            conflicts.append({
                'reservation_id': str(res_item.reservation.id),
                'order_number': res_item.reservation.order.order_number,
                'customer': res_item.reservation.order.customer.username,
                'quantity': res_item.quantity,
                'start_datetime': res_item.start_datetime.isoformat(),
                'end_datetime': res_item.end_datetime.isoformat(),
            })
        
        return {
            'available': is_available,
            'available_quantity': available_quantity,
            'total_stock': total_stock,
            'reserved_quantity': reserved_quantity,
            'conflicts': conflicts
        }
    
    @staticmethod
    def batch_check_availability(
        items: List[Dict],  # [{'product_id': str, 'start_datetime': dt, 'end_datetime': dt, 'quantity': int}]
        exclude_order_id: Optional[str] = None
    ) -> Dict[str, Dict]:
        """
        Check availability for multiple products/periods at once
        
        Returns:
        {
            'product_id_1': availability_result,
            'product_id_2': availability_result,
            ...
        }
        """
        results = {}
        
        for item in items:
            product_id = item['product_id']
            results[product_id] = AvailabilityService.check_availability(
                product_id=product_id,
                start_datetime=item['start_datetime'],
                end_datetime=item['end_datetime'],
                quantity=item['quantity'],
                exclude_order_id=exclude_order_id
            )
        
        return results
    
    @staticmethod
    def find_alternative_dates(
        product_id: str,
        preferred_start: datetime,
        preferred_end: datetime,
        quantity: int = 1,
        search_days: int = 30
    ) -> List[Dict]:
        """
        Find alternative available dates if preferred dates are not available
        
        Returns list of available periods:
        [
            {
                'start_datetime': datetime,
                'end_datetime': datetime,
                'available_quantity': int
            }
        ]
        """
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return []
        
        alternatives = []
        duration = preferred_end - preferred_start
        
        # Check dates within search range
        for days_offset in range(-search_days, search_days + 1):
            if days_offset == 0:  # Skip the original preferred dates
                continue
                
            test_start = preferred_start + timezone.timedelta(days=days_offset)
            test_end = test_start + duration
            
            # Skip past dates
            if test_start < timezone.now():
                continue
            
            availability = AvailabilityService.check_availability(
                product_id=product_id,
                start_datetime=test_start,
                end_datetime=test_end,
                quantity=quantity
            )
            
            if availability['available']:
                alternatives.append({
                    'start_datetime': test_start,
                    'end_datetime': test_end,
                    'available_quantity': availability['available_quantity']
                })
        
        # Sort by proximity to preferred start date
        alternatives.sort(key=lambda x: abs((x['start_datetime'] - preferred_start).days))
        
        return alternatives[:10]  # Return top 10 alternatives
    
    @staticmethod
    def get_product_calendar(
        product_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Dict]:
        """
        Get availability calendar for a product over a date range
        
        Returns:
        {
            'YYYY-MM-DD': {
                'available_quantity': int,
                'reserved_quantity': int,
                'total_stock': int
            }
        }
        """
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return {}
        
        calendar = {}
        current_date = start_date.date()
        end_date = end_date.date()
        
        while current_date <= end_date:
            day_start = timezone.make_aware(
                datetime.combine(current_date, datetime.min.time())
            )
            day_end = timezone.make_aware(
                datetime.combine(current_date, datetime.max.time())
            )
            
            # Get reservations for this day
            reservations = ReservationItem.objects.filter(
                product_id=product_id,
                start_datetime__lt=day_end,
                end_datetime__gt=day_start,
                reservation__status__in=['RESERVED', 'ACTIVE']
            )
            
            reserved_quantity = reservations.aggregate(
                total=Sum('quantity')
            )['total'] or 0
            
            available_quantity = max(0, product.stock_quantity - reserved_quantity)
            
            calendar[current_date.isoformat()] = {
                'available_quantity': available_quantity,
                'reserved_quantity': reserved_quantity,
                'total_stock': product.stock_quantity
            }
            
            current_date += timezone.timedelta(days=1)
        
        return calendar
    
    @staticmethod
    def get_upcoming_returns(days_ahead: int = 7) -> List[Dict]:
        """
        Get list of items due for return in the next N days
        
        Returns:
        [
            {
                'reservation_id': str,
                'order_number': str,
                'customer': str,
                'product_name': str,
                'quantity': int,
                'due_date': datetime,
                'days_until_due': int,
                'is_overdue': bool
            }
        ]
        """
        from apps.orders.models import Reservation
        
        cutoff_date = timezone.now() + timezone.timedelta(days=days_ahead)
        
        upcoming_reservations = Reservation.objects.filter(
            status__in=['RESERVED', 'ACTIVE'],
            return_due_at__lte=cutoff_date
        ).select_related('order', 'order__customer').prefetch_related('items__product')
        
        upcoming_returns = []
        
        for reservation in upcoming_reservations:
            for item in reservation.items.all():
                days_until_due = (reservation.return_due_at - timezone.now()).days
                
                upcoming_returns.append({
                    'reservation_id': str(reservation.id),
                    'order_number': reservation.order.order_number,
                    'customer': reservation.order.customer.username,
                    'customer_email': reservation.order.customer.email,
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'due_date': reservation.return_due_at,
                    'days_until_due': days_until_due,
                    'is_overdue': days_until_due < 0
                })
        
        # Sort by due date
        upcoming_returns.sort(key=lambda x: x['due_date'])
        
        return upcoming_returns
    
    @staticmethod
    def check_conflicts_for_order(order_id: str) -> Dict:
        """
        Check for any availability conflicts for an entire order
        
        Returns:
        {
            'has_conflicts': bool,
            'conflicts': List[dict],
            'resolvable': bool
        }
        """
        from apps.orders.models import RentalOrder
        
        try:
            order = RentalOrder.objects.get(id=order_id)
        except RentalOrder.DoesNotExist:
            return {'has_conflicts': True, 'conflicts': ['Order not found'], 'resolvable': False}
        
        conflicts = []
        
        for item in order.items.all():
            availability = AvailabilityService.check_availability(
                product_id=str(item.product.id),
                start_datetime=item.start_datetime,
                end_datetime=item.end_datetime,
                quantity=item.quantity,
                exclude_order_id=order_id
            )
            
            if not availability['available']:
                conflicts.append({
                    'product_id': str(item.product.id),
                    'product_name': item.product.name,
                    'requested_quantity': item.quantity,
                    'available_quantity': availability['available_quantity'],
                    'shortage': item.quantity - availability['available_quantity'],
                    'period': f"{item.start_datetime} to {item.end_datetime}",
                    'item_conflicts': availability['conflicts']
                })
        
        has_conflicts = len(conflicts) > 0
        resolvable = all(conflict['shortage'] <= 5 for conflict in conflicts)  # Arbitrary threshold
        
        return {
            'has_conflicts': has_conflicts,
            'conflicts': conflicts,
            'resolvable': resolvable
        }

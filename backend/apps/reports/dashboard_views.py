from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model

# Import models from different apps
from apps.orders.models import RentalOrder, RentalItem
from apps.catalog.models import Product
from apps.payments.models import Payment
from apps.deliveries.models import DeliveryDocument
from apps.accounts.models import UserProfile

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get comprehensive dashboard statistics for rental management system
    """
    try:
        # Get current date for calculations
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Calculate rental statistics
        total_rentals = RentalOrder.objects.count()
        
        # Active rentals (orders that are confirmed, delivered, or active)
        active_rentals = RentalOrder.objects.filter(
            status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP'],
            rental_start__lte=now,
            rental_end__gte=now
        ).count()
        
        # Total revenue from completed and active orders
        total_revenue = RentalOrder.objects.filter(
            status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Pending returns (orders that have passed end date but not returned)
        pending_returns = RentalOrder.objects.filter(
            status__in=['ACTIVE', 'PICKED_UP'],
            rental_end__lt=now
        ).count()
        
        # Overdue rentals (same as pending returns but more specific)
        overdue_rentals = RentalOrder.objects.filter(
            status__in=['ACTIVE', 'PICKED_UP'],
            rental_end__lt=now - timedelta(days=1)  # Grace period of 1 day
        ).count()
        
        # Available products (products with stock > 0)
        available_products = Product.objects.filter(
            is_active=True,
            quantity_on_hand__gt=0
        ).count()
        
        # Recent activity metrics
        recent_orders = RentalOrder.objects.filter(
            created_at__gte=thirty_days_ago
        ).count()
        
        recent_revenue = RentalOrder.objects.filter(
            created_at__gte=thirty_days_ago,
            status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Payment statistics
        total_payments = Payment.objects.filter(
            payment_status='completed'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        pending_payments = Payment.objects.filter(
            payment_status='pending'
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Customer statistics
        total_customers = User.objects.filter(
            profile__role='CUSTOMER'
        ).count()
        
        active_customers = User.objects.filter(
            profile__role='CUSTOMER',
            rental_orders__created_at__gte=thirty_days_ago
        ).distinct().count()
        
        # Product performance
        most_rented_products = Product.objects.annotate(
            rental_count=Count('rentalitem__order', filter=Q(rentalitem__order__status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']))
        ).filter(rental_count__gt=0).order_by('-rental_count')[:5]
        
        # Delivery statistics
        total_deliveries = DeliveryDocument.objects.count()
        completed_deliveries = DeliveryDocument.objects.filter(
            status='completed'
        ).count()
        
        delivery_success_rate = (completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0
        
        # Monthly growth calculation
        previous_month = thirty_days_ago - timedelta(days=30)
        previous_month_revenue = RentalOrder.objects.filter(
            created_at__gte=previous_month,
            created_at__lt=thirty_days_ago,
            status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        monthly_growth = 0
        if previous_month_revenue > 0:
            monthly_growth = ((recent_revenue - previous_month_revenue) / previous_month_revenue) * 100
        
        # Average order value
        avg_order_value = RentalOrder.objects.filter(
            status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
        ).aggregate(
            avg=Avg('total_amount')
        )['avg'] or 0
        
        # Top performing products
        top_products = []
        for product in most_rented_products:
            # Calculate revenue for this product
            product_revenue = RentalItem.objects.filter(
                product=product,
                order__status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
            ).aggregate(
                total=Sum('line_total')
            )['total'] or 0
            
            top_products.append({
                'name': product.name,
                'rental_count': product.rental_count or 0,
                'revenue': float(product_revenue)
            })
        
        # Compile dashboard statistics
        dashboard_data = {
            'total_rentals': total_rentals,
            'active_rentals': active_rentals,
            'total_revenue': float(total_revenue),
            'pending_returns': pending_returns,
            'overdue_rentals': overdue_rentals,
            'available_products': available_products,
            
            # Additional metrics
            'recent_orders': recent_orders,
            'recent_revenue': float(recent_revenue),
            'monthly_growth': round(monthly_growth, 1),
            'total_customers': total_customers,
            'active_customers': active_customers,
            'avg_order_value': round(float(avg_order_value), 2),
            
            # Payment metrics
            'total_payments_received': float(total_payments),
            'pending_payments': float(pending_payments),
            
            # Delivery metrics
            'total_deliveries': total_deliveries,
            'delivery_success_rate': round(delivery_success_rate, 1),
            
            # Top products
            'top_products': top_products,
            
            # Utilization metrics
            'inventory_utilization': round((total_rentals / max(available_products, 1)) * 10, 1),  # Simplified calculation
            'customer_retention': round((active_customers / max(total_customers, 1)) * 100, 1),
        }
        
        return Response({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        # Fallback data in case of any errors
        fallback_data = {
            'total_rentals': 0,
            'active_rentals': 0,
            'total_revenue': 0.0,
            'pending_returns': 0,
            'overdue_rentals': 0,
            'available_products': 0,
            'recent_orders': 0,
            'recent_revenue': 0.0,
            'monthly_growth': 0.0,
            'total_customers': 0,
            'active_customers': 0,
            'avg_order_value': 0.0,
            'total_payments_received': 0.0,
            'pending_payments': 0.0,
            'total_deliveries': 0,
            'delivery_success_rate': 0.0,
            'top_products': [],
            'inventory_utilization': 0.0,
            'customer_retention': 0.0,
        }
        
        return Response({
            'success': True,
            'data': fallback_data,
            'note': 'Using fallback data due to calculation error'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_recent_activity(request):
    """
    Get recent activity for dashboard
    """
    try:
        limit = int(request.GET.get('limit', 10))
        
        # Get recent orders
        recent_orders = RentalOrder.objects.select_related('customer').order_by('-created_at')[:limit]
        
        # Get recent payments
        recent_payments = Payment.objects.select_related('order').order_by('-created_at')[:limit]
        
        # Get recent deliveries
        recent_deliveries = DeliveryDocument.objects.order_by('-created_at')[:limit]
        
        # Format the data
        activities = []
        
        # Add orders
        for order in recent_orders:
            customer_name = ""
            if hasattr(order, 'customer') and order.customer:
                if hasattr(order.customer, 'profile') and order.customer.profile.company_name:
                    customer_name = order.customer.profile.company_name
                elif order.customer.first_name and order.customer.last_name:
                    customer_name = f"{order.customer.first_name} {order.customer.last_name}"
                else:
                    customer_name = order.customer.username
            
            activities.append({
                'type': 'order',
                'id': order.id,
                'title': f"New rental order {order.order_id}",
                'description': f"Order by {customer_name}",
                'amount': float(order.total_amount),
                'status': order.status,
                'created_at': order.created_at.isoformat(),
                'icon': 'shopping-cart'
            })
        
        # Add payments
        for payment in recent_payments:
            activities.append({
                'type': 'payment',
                'id': payment.id,
                'title': f"Payment received",
                'description': f"Payment for order {payment.order.order_id if payment.order else 'N/A'}",
                'amount': float(payment.amount),
                'status': payment.payment_status,
                'created_at': payment.created_at.isoformat(),
                'icon': 'credit-card'
            })
        
        # Add deliveries
        for delivery in recent_deliveries:
            activities.append({
                'type': 'delivery',
                'id': delivery.id,
                'title': f"Delivery scheduled",
                'description': f"Delivery for {delivery.delivery_date}",
                'amount': 0,
                'status': delivery.status,
                'created_at': delivery.created_at.isoformat(),
                'icon': 'truck'
            })
        
        # Sort by created_at and limit
        activities.sort(key=lambda x: x['created_at'], reverse=True)
        activities = activities[:limit]
        
        return Response({
            'success': True,
            'data': activities
        })
        
    except Exception as e:
        return Response({
            'success': True,
            'data': [],
            'note': 'No recent activity available'
        })

"""
Views for retailer-specific functionality
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta
from .models import UserProfile
from .serializers import UserProfileSerializer
from apps.orders.models import RentalOrder
from apps.catalog.models import Product


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def retailer_profile(request):
    """
    Get or update retailer profile information
    """
    try:
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={
                'role': 'ADMIN',  # Default role for retailers
                'phone': '',
                'company_name': '',
                'address': '',
                'city': '',
                'state': '',
                'postal_code': '',
                'country': 'India'
            }
        )
        
        if request.method == 'GET':
            # Return profile data
            profile_data = {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'profile': {
                    'role': profile.role,
                    'phone': profile.phone,
                    'address': profile.address,
                    'city': profile.city,
                    'state': profile.state,
                    'postal_code': profile.postal_code,
                    'country': profile.country,
                    'company_name': profile.company_name,
                    'tax_id': profile.tax_id,
                    'preferred_currency': profile.preferred_currency,
                    'is_verified': profile.is_verified,
                    'created_at': profile.created_at,
                    'updated_at': profile.updated_at
                },
                'is_active': request.user.is_active,
                'date_joined': request.user.date_joined,
                'last_login': request.user.last_login
            }
            
            return Response({
                'success': True,
                'data': profile_data
            })
            
        elif request.method in ['PUT', 'PATCH']:
            # Update profile data
            user_data = request.data
            
            # Update user fields
            if 'first_name' in user_data:
                request.user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                request.user.last_name = user_data['last_name']
            if 'email' in user_data:
                request.user.email = user_data['email']
            
            request.user.save()
            
            # Update profile fields
            if 'phone' in user_data:
                profile.phone = user_data['phone']
            if 'address' in user_data:
                profile.address = user_data['address']
            if 'city' in user_data:
                profile.city = user_data['city']
            if 'state' in user_data:
                profile.state = user_data['state']
            if 'postal_code' in user_data:
                profile.postal_code = user_data['postal_code']
            if 'country' in user_data:
                profile.country = user_data['country']
            if 'company_name' in user_data:
                profile.company_name = user_data['company_name']
            if 'tax_id' in user_data:
                profile.tax_id = user_data['tax_id']
            if 'preferred_currency' in user_data:
                profile.preferred_currency = user_data['preferred_currency']
            if 'role' in user_data and user_data['role'] in ['ADMIN', 'STAFF']:
                profile.role = user_data['role']
                
            profile.save()
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully'
            })
            
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retailer_dashboard(request):
    """
    Get retailer dashboard statistics
    """
    try:
        # Get date ranges
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Calculate basic statistics
        total_orders = RentalOrder.objects.count()
        active_orders = RentalOrder.objects.filter(
            status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP']
        ).count()
        
        # Recent activity
        recent_orders = RentalOrder.objects.filter(
            created_at__gte=week_ago
        ).count()
        
        # Revenue calculations
        total_revenue = RentalOrder.objects.filter(
            status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        monthly_revenue = RentalOrder.objects.filter(
            created_at__gte=month_ago,
            status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Product statistics
        total_products = Product.objects.filter(is_active=True).count()
        available_products = Product.objects.filter(
            is_active=True,
            quantity_on_hand__gt=0
        ).count()
        
        dashboard_data = {
            'orders': {
                'total': total_orders,
                'active': active_orders,
                'recent': recent_orders
            },
            'revenue': {
                'total': float(total_revenue),
                'monthly': float(monthly_revenue)
            },
            'products': {
                'total': total_products,
                'available': available_products,
                'out_of_stock': total_products - available_products
            },
            'date_range': {
                'today': today.isoformat(),
                'week_start': week_ago.date().isoformat(),
                'month_start': month_ago.date().isoformat()
            }
        }
        
        return Response({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retailer_analytics(request):
    """
    Get retailer analytics and insights
    """
    try:
        # Get query parameters
        period = request.query_params.get('period', '30')  # days
        
        # Calculate date range
        now = timezone.now()
        start_date = now - timedelta(days=int(period))
        
        # Order analytics
        orders_by_status = RentalOrder.objects.filter(
            created_at__gte=start_date
        ).values('status').annotate(count=Count('id'))
        
        # Revenue by time period (daily for last 30 days)
        revenue_by_day = []
        for i in range(int(period)):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            daily_revenue = RentalOrder.objects.filter(
                created_at__gte=day_start,
                created_at__lte=day_end,
                status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            revenue_by_day.append({
                'date': day_start.date().isoformat(),
                'revenue': float(daily_revenue)
            })
        
        # Top products (most rented)
        from apps.orders.models import RentalItem
        top_products = Product.objects.annotate(
            rental_count=Count('rentalitem__order', filter=RentalItem.objects.filter(
                order__created_at__gte=start_date,
                order__status__in=['CONFIRMED', 'ACTIVE', 'PICKED_UP', 'COMPLETED']
            ).values('product').distinct())
        ).filter(rental_count__gt=0).order_by('-rental_count')[:10]
        
        top_products_data = []
        for product in top_products:
            top_products_data.append({
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'rental_count': product.rental_count or 0
            })
        
        analytics_data = {
            'period_days': int(period),
            'orders_by_status': list(orders_by_status),
            'revenue_by_day': revenue_by_day[::-1],  # Reverse to show chronologically
            'top_products': top_products_data
        }
        
        return Response({
            'success': True,
            'data': analytics_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

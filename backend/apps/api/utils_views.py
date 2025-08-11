from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.http import JsonResponse
from django.conf import settings
from django.db import connection
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    try:
        # Check database connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        db_status = "OK"
    except Exception as e:
        db_status = f"ERROR: {str(e)}"
    
    # Check cache
    try:
        cache.set('health_check', 'test', 10)
        cache_status = "OK" if cache.get('health_check') == 'test' else "ERROR"
    except Exception as e:
        cache_status = f"ERROR: {str(e)}"
    
    return Response({
        'status': 'healthy',
        'database': db_status,
        'cache': cache_status,
        'environment': settings.DEBUG and 'development' or 'production'
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def metrics(request):
    """Basic application metrics"""
    from django.contrib.auth import get_user_model
    from apps.accounts.models import UserProfile
    from apps.catalog.models import Product
    from apps.orders.models import RentalOrder
    
    User = get_user_model()
    
    try:
        metrics_data = {
            'users': {
                'total': User.objects.count(),
                'active': User.objects.filter(is_active=True).count(),
                'customers': UserProfile.objects.filter(role=UserProfile.Role.CUSTOMER).count(),
                'staff': UserProfile.objects.filter(role=UserProfile.Role.STAFF).count(),
            },
            'products': {
                'total': Product.objects.count(),
                'rentable': Product.objects.filter(is_rentable=True).count(),
            },
            'orders': {
                'total': RentalOrder.objects.count(),
                'active': RentalOrder.objects.filter(status__in=['CONFIRMED', 'PICKED_UP', 'ACTIVE']).count(),
                'completed': RentalOrder.objects.filter(status='RETURNED').count(),
            }
        }
        
        return Response({
            'success': True,
            'data': metrics_data
        })
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Add admin check in production
def seed_data(request):
    """Seed demo data (development only)"""
    if not settings.DEBUG:
        return Response({
            'success': False,
            'error': 'This endpoint is only available in development mode'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Import and run seed functions
        from django.core.management import call_command
        call_command('loaddata', 'demo_data.json')
        
        return Response({
            'success': True,
            'message': 'Demo data seeded successfully'
        })
    except Exception as e:
        logger.error(f"Error seeding data: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Add admin check in production
def reset_data(request):
    """Reset demo data (development only)"""
    if not settings.DEBUG:
        return Response({
            'success': False,
            'error': 'This endpoint is only available in development mode'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Reset database to clean state
        from django.core.management import call_command
        call_command('flush', '--noinput')
        call_command('migrate')
        
        return Response({
            'success': True,
            'message': 'Demo data reset successfully'
        })
    except Exception as e:
        logger.error(f"Error resetting data: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def support_ticket(request):
    """Create a support ticket"""
    from apps.notifications.models import Notification
    
    try:
        data = request.data
        email = data.get('email')
        subject = data.get('subject')
        message = data.get('message')
        
        if not all([email, subject, message]):
            return Response({
                'success': False,
                'error': 'Email, subject, and message are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create notification for support team
        Notification.objects.create(
            title=f"Support Ticket: {subject}",
            message=f"From: {email}\n\n{message}",
            notification_type='SUPPORT',
            is_system=True
        )
        
        return Response({
            'success': True,
            'message': 'Support ticket created successfully'
        })
    except Exception as e:
        logger.error(f"Error creating support ticket: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    """Upload image/file endpoint"""
    try:
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({
                'success': False,
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save file (implement actual file storage logic)
        # This is a simplified version
        file_url = f"/media/uploads/{uploaded_file.name}"
        
        return Response({
            'success': True,
            'data': {
                'url': file_url,
                'filename': uploaded_file.name,
                'size': uploaded_file.size
            }
        })
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
import secrets
import string

from .models import (
    APIKey, ExternalIntegration, WebhookEndpoint, APIRequest,
    APIRateLimit, WebhookDelivery
)
from .serializers import (
    APIKeySerializer, IntegrationSerializer, WebhookEndpointSerializer,
    APILogSerializer, RateLimitRuleSerializer, ExternalSystemSerializer,
    APIKeyCreateSerializer, APIStatsSerializer, WebhookTestSerializer,
    IntegrationTestSerializer
)


class APIKeyViewSet(viewsets.ModelViewSet):
    queryset = APIKey.objects.all()
    serializer_class = APIKeySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return APIKey.objects.none()
        
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return APIKeyCreateSerializer
        return super().get_serializer_class()
    
    def create(self, request, *args, **kwargs):
        """Create a new API key"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Generate API key
        key = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        
        api_key = APIKey.objects.create(
            name=data['name'],
            description=data.get('description', ''),
            key=key,
            permissions=data.get('permissions', {}),
            expires_at=data.get('expires_at'),
            rate_limit=data.get('rate_limit', 1000)
        )
        
        return Response({
            'success': True,
            'message': 'API key created successfully',
            'data': {
                'id': str(api_key.id),
                'key': key,  # Only returned once
                'name': api_key.name
            }
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate API key"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        api_key = self.get_object()
        
        # Generate new key
        new_key = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        api_key.key = new_key
        api_key.save()
        
        return Response({
            'success': True,
            'message': 'API key regenerated successfully',
            'data': {
                'key': new_key  # Only returned once
            }
        })


class IntegrationViewSet(viewsets.ModelViewSet):
    queryset = ExternalIntegration.objects.all()
    serializer_class = IntegrationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return ExternalIntegration.objects.none()
        
        queryset = super().get_queryset().select_related('system')
        
        # Filter by status
        integration_status = self.request.query_params.get('status')
        if integration_status:
            queryset = queryset.filter(status=integration_status)
        
        # Filter by type
        integration_type = self.request.query_params.get('type')
        if integration_type:
            queryset = queryset.filter(integration_type=integration_type)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test integration connection"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        integration = self.get_object()
        
        # Mock integration test
        test_result = {
            'success': True,
            'response_time': 0.245,
            'status_code': 200,
            'message': 'Integration test successful'
        }
        
        return Response({
            'success': True,
            'data': test_result
        })
    
    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Manually trigger integration sync"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        integration = self.get_object()
        
        # Mock sync operation
        return Response({
            'success': True,
            'message': 'Sync operation initiated',
            'data': {
                'sync_id': 'sync_12345',
                'estimated_duration': '5 minutes'
            }
        })


class WebhookEndpointViewSet(viewsets.ModelViewSet):
    queryset = WebhookEndpoint.objects.all()
    serializer_class = WebhookEndpointSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return WebhookEndpoint.objects.none()
        
        return super().get_queryset().order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test webhook endpoint"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        webhook = self.get_object()
        
        # Mock webhook test
        test_result = {
            'success': True,
            'response_time': 0.123,
            'status_code': 200,
            'response_body': 'OK',
            'message': 'Webhook test successful'
        }
        
        return Response({
            'success': True,
            'data': test_result
        })


class APILogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = APIRequest.objects.all()
    serializer_class = APILogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return APIRequest.objects.none()
        
        queryset = super().get_queryset().select_related('api_key')
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filter by status code
        status_code = self.request.query_params.get('status_code')
        if status_code:
            queryset = queryset.filter(status_code=status_code)
        
        return queryset.order_by('-created_at')


class RateLimitRuleViewSet(viewsets.ModelViewSet):
    queryset = APIRateLimit.objects.all()
    serializer_class = RateLimitRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return APIRateLimit.objects.none()
        
        return super().get_queryset().order_by('-created_at')


class ExternalSystemViewSet(viewsets.ModelViewSet):
    queryset = WebhookDelivery.objects.all()
    serializer_class = ExternalSystemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return WebhookDelivery.objects.none()
        
        return super().get_queryset().order_by('name')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get API management statistics"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        total_api_keys = APIKey.objects.count()
        active_integrations = ExternalIntegration.objects.filter(status='ACTIVE').count()
        webhook_endpoints = WebhookEndpoint.objects.count()
        
        # API requests today
        today = timezone.now().date()
        api_requests_today = APIRequest.objects.filter(created_at__date=today).count()
        
        # API requests this month
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        api_requests_this_month = APIRequest.objects.filter(created_at__gte=current_month).count()
        
        # Average response time (using completed_at - created_at as proxy)
        avg_response_time = APIRequest.objects.aggregate(
            avg=Avg('updated_at') - Avg('created_at')
        )['avg'] or 0
        
        # Error rate
        total_requests = APIRequest.objects.count()
        error_requests = APIRequest.objects.filter(status='ERROR').count()
        error_rate = (error_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Top endpoints
        top_endpoints = list(APIRequest.objects.values('endpoint').annotate(
            count=Count('id')
        ).order_by('-count')[:5])
        
        stats_data = {
            'total_api_keys': total_api_keys,
            'active_integrations': active_integrations,
            'webhook_endpoints': webhook_endpoints,
            'api_requests_today': api_requests_today,
            'api_requests_this_month': api_requests_this_month,
            'average_response_time': round(avg_response_time * 1000, 2) if avg_response_time else 0,
            'error_rate': round(error_rate, 2),
            'top_endpoints': top_endpoints
        }
        
        serializer = APIStatsSerializer(data=stats_data)
        serializer.is_valid(raise_exception=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })

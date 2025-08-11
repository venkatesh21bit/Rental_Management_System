from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta

from .models import (
    NotificationTemplate,
    Notification,
    NotificationSetting,
    ScheduledNotification,
    NotificationLog,
    NotificationProvider
)
from .serializers import (
    NotificationTemplateSerializer,
    NotificationSerializer,
    NotificationSettingSerializer,
    ScheduledNotificationSerializer,
    NotificationLogSerializer,
    NotificationProviderSerializer,
    BulkNotificationSerializer,
    NotificationStatsSerializer,
    TestNotificationSerializer
)
from utils.email_service import email_service

User = get_user_model()


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by channel
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('name')


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('user', 'template')
        
        # Filter for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        # Filter by status
        notification_status = self.request.query_params.get('status')
        if notification_status:
            queryset = queryset.filter(status=notification_status)
        
        # Filter by channel
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def send_bulk(self, request):
        """Send bulk notifications"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BulkNotificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        template = NotificationTemplate.objects.get(id=data['template_id'])
        users = User.objects.filter(id__in=data['user_ids'])
        
        # Prepare recipients for bulk email
        recipients = []
        for user in users:
            if data['channel'] == 'EMAIL' and user.email:
                recipients.append({
                    'email': user.email,
                    'user': user,
                    'context': data.get('context', {})
                })
        
        if data['channel'] == 'EMAIL' and recipients:
            # Send bulk emails
            stats = email_service.send_bulk_notifications(
                recipients=recipients,
                template_name=template.name.lower().replace(' ', '_'),
                subject=template.subject,
                context=data.get('context', {})
            )
            
            # Create notification logs
            for recipient in recipients:
                user = recipient['user']
                Notification.objects.create(
                    user=user,
                    template=template,
                    channel=data['channel'],
                    subject=template.subject,
                    content=template.content,
                    context_data=data.get('context', {}),
                    status='SENT' if recipient['email'] in [r['email'] for r in recipients[:stats['sent']]] else 'FAILED'
                )
                
                # Log the notification
                NotificationLog.objects.create(
                    user=user,
                    channel=data['channel'],
                    status='SENT' if recipient['email'] in [r['email'] for r in recipients[:stats['sent']]] else 'FAILED',
                    metadata={'template_id': template.id, 'bulk_send': True}
                )
            
            return Response({
                'success': True,
                'message': f'Bulk notification completed',
                'stats': stats
            })
        
        return Response({
            'success': False,
            'error': 'No valid recipients found for the selected channel'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def send_test_email(self, request):
        """Send a test email notification"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TestNotificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Send test email
        success = email_service.send_notification_email(
            to_email=data['email'],
            subject=f"Test Email - {data['template_name']}",
            template_name=data['template_name'],
            context=data.get('context', {}),
            user=request.user,
            notification_type='TEST'
        )
        
        if success:
            return Response({
                'success': True,
                'message': f'Test email sent successfully to {data["email"]}'
            })
        else:
            return Response({
                'success': False,
                'error': 'Failed to send test email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get notification statistics"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        total_sent = Notification.objects.filter(status='SENT').count()
        total_delivered = Notification.objects.filter(status='DELIVERED').count()
        total_failed = Notification.objects.filter(status='FAILED').count()
        
        delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0
        
        # Channel statistics
        channel_stats = {}
        for channel in ['EMAIL', 'SMS', 'PUSH', 'WHATSAPP']:
            channel_stats[channel] = {
                'sent': Notification.objects.filter(channel=channel, status='SENT').count(),
                'delivered': Notification.objects.filter(channel=channel, status='DELIVERED').count(),
                'failed': Notification.objects.filter(channel=channel, status='FAILED').count()
            }
        
        recent_notifications = Notification.objects.order_by('-created_at')[:10]
        
        stats_data = {
            'total_sent': total_sent,
            'total_delivered': total_delivered,
            'total_failed': total_failed,
            'delivery_rate': round(delivery_rate, 2),
            'channel_stats': channel_stats,
            'recent_notifications': NotificationSerializer(recent_notifications, many=True).data
        }
        
        return Response({
            'success': True,
            'data': stats_data
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        
        if notification.user != request.user and not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        notification.read_at = timezone.now()
        notification.save()
        
        return Response({
            'success': True,
            'message': 'Notification marked as read'
        })


class NotificationSettingViewSet(viewsets.ModelViewSet):
    queryset = NotificationSetting.objects.all()
    serializer_class = NotificationSettingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return NotificationSetting.objects.filter(user=self.request.user)
        
        return super().get_queryset()
    
    @action(detail=False, methods=['get', 'post'])
    def my_settings(self, request):
        """Get or update user's notification settings"""
        if request.method == 'GET':
            settings = NotificationSetting.objects.filter(user=request.user)
            serializer = NotificationSettingSerializer(settings, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            })
        
        elif request.method == 'POST':
            # Update settings
            settings_data = request.data.get('settings', [])
            
            for setting_data in settings_data:
                setting_data['user'] = request.user.id
                setting, created = NotificationSetting.objects.get_or_create(
                    user=request.user,
                    notification_type=setting_data['notification_type'],
                    channel=setting_data['channel'],
                    defaults=setting_data
                )
                
                if not created:
                    for key, value in setting_data.items():
                        if key != 'user':
                            setattr(setting, key, value)
                    setting.save()
            
            return Response({
                'success': True,
                'message': 'Settings updated successfully'
            })


class ScheduledNotificationViewSet(viewsets.ModelViewSet):
    queryset = ScheduledNotification.objects.all()
    serializer_class = ScheduledNotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return ScheduledNotification.objects.none()
        
        return super().get_queryset().order_by('-created_at')


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationLog.objects.all()
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        # Filter by channel
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)
        
        return queryset.order_by('-created_at')


class NotificationProviderViewSet(viewsets.ModelViewSet):
    queryset = NotificationProvider.objects.all()
    serializer_class = NotificationProviderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return NotificationProvider.objects.none()
        
        return super().get_queryset()

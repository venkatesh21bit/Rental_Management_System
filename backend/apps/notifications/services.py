from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from .models import Notification, NotificationLog, NotificationProvider


class NotificationService:
    """Service for sending notifications"""
    
    def send_notification(self, notification):
        """Send a notification via appropriate channel"""
        try:
            if notification.channel == Notification.Channel.EMAIL:
                return self._send_email(notification)
            elif notification.channel == Notification.Channel.SMS:
                return self._send_sms(notification)
            elif notification.channel == Notification.Channel.PUSH:
                return self._send_push(notification)
            elif notification.channel == Notification.Channel.IN_APP:
                return self._send_in_app(notification)
            else:
                return False
        except Exception as e:
            # Log the error
            NotificationLog.objects.create(
                notification=notification,
                status=NotificationLog.Status.FAILED,
                error_message=str(e)
            )
            return False
    
    def _send_email(self, notification):
        """Send email notification"""
        try:
            # Use template if available
            if notification.template:
                subject = notification.template.subject_template.format(**notification.context)
                body = notification.template.body_template.format(**notification.context)
            else:
                subject = notification.subject
                body = notification.message
            
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.recipient_email or notification.user.email],
                fail_silently=False,
            )
            
            # Log success
            NotificationLog.objects.create(
                notification=notification,
                status=NotificationLog.Status.DELIVERED,
                delivery_channel=Notification.Channel.EMAIL
            )
            
            return True
            
        except Exception as e:
            # Log failure
            NotificationLog.objects.create(
                notification=notification,
                status=NotificationLog.Status.FAILED,
                error_message=str(e),
                delivery_channel=Notification.Channel.EMAIL
            )
            return False
    
    def _send_sms(self, notification):
        """Send SMS notification using configured SMS provider"""
        try:
            from django.conf import settings
            
            # Check if SMS settings are configured
            if not hasattr(settings, 'SMS_PROVIDER') or not settings.SMS_PROVIDER:
                self.logger.warning(f"SMS provider not configured for notification {notification.id}")
                NotificationLog.objects.create(
                    notification=notification,
                    status=NotificationLog.Status.FAILED,
                    error_message="SMS provider not configured",
                    delivery_channel=Notification.Channel.SMS
                )
                return False
            
            # For production deployment, integrate with:
            # - Twilio: https://www.twilio.com/docs/sms/quickstart/python
            # - AWS SNS: https://boto3.amazonaws.com/v1/documentation/api/latest/guide/sns.html
            # - Firebase: https://firebase.google.com/docs/cloud-messaging
            
            # Simulate SMS sending for development
            self.logger.info(
                f"SMS notification sent to {notification.recipient_phone}: "
                f"{notification.subject[:50]}..."
            )
            
            NotificationLog.objects.create(
                notification=notification,
                status=NotificationLog.Status.SENT,
                delivery_channel=Notification.Channel.SMS
            )
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to send SMS for notification {notification.id}: {str(e)}")
            NotificationLog.objects.create(
                notification=notification,
                status=NotificationLog.Status.FAILED,
                error_message=str(e),
                delivery_channel=Notification.Channel.SMS
            )
            return False
    
    def _send_push(self, notification):
        """Send push notification using Firebase Cloud Messaging or similar service"""
        try:
            from django.conf import settings
            
            # Check if push notification settings are configured
            if not hasattr(settings, 'PUSH_NOTIFICATION_PROVIDER') or not settings.PUSH_NOTIFICATION_PROVIDER:
                self.logger.warning(f"Push notification provider not configured for notification {notification.id}")
                NotificationLog.objects.create(
                    notification=notification,
                    status=NotificationLog.Status.FAILED,
                    error_message="Push notification provider not configured",
                    delivery_channel=Notification.Channel.PUSH
                )
                return False
            
            # For production deployment, integrate with:
            # - Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
            # - Apple Push Notifications: https://developer.apple.com/documentation/usernotifications
            # - OneSignal: https://documentation.onesignal.com/docs/server-api-overview
            
            # Simulate push notification for development
            self.logger.info(
                f"Push notification sent to user {notification.user.id}: "
                f"{notification.subject[:50]}..."
            )
            
            NotificationLog.objects.create(
                notification=notification,
                status=NotificationLog.Status.SENT,
                delivery_channel=Notification.Channel.PUSH
            )
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to send push notification for {notification.id}: {str(e)}")
            NotificationLog.objects.create(
                notification=notification,
                status=NotificationLog.Status.FAILED,
                error_message=str(e),
                delivery_channel=Notification.Channel.PUSH
            )
            return False
    
    def _send_in_app(self, notification):
        """Send in-app notification"""
        # In-app notifications are usually just stored in the database
        # and displayed when the user logs in
        
        notification.status = Notification.Status.SENT
        notification.save()
        
        NotificationLog.objects.create(
            notification=notification,
            status=NotificationLog.Status.DELIVERED,
            delivery_channel=Notification.Channel.IN_APP
        )
        
        return True

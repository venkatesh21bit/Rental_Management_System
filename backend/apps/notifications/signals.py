from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import (
    Notification, NotificationTemplate, ScheduledNotification,
    NotificationLog, NotificationSetting
)


@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    """Handle notification creation"""
    if created and instance.send_immediately:
        # Send notification immediately
        try:
            from apps.notifications.tasks import send_notification_task
            send_notification_task.delay(instance.id)
        except ImportError:
            # Fallback to synchronous sending
            from apps.notifications.services import NotificationService
            service = NotificationService()
            service.send_notification(instance)


@receiver(post_save, sender=ScheduledNotification)
def scheduled_notification_created(sender, instance, created, **kwargs):
    """Handle scheduled notification creation"""
    if created:
        # Queue notification for scheduled time
        try:
            from apps.notifications.tasks import schedule_notification_task
            schedule_notification_task.apply_async(
                args=[instance.id],
                eta=instance.scheduled_for
            )
        except ImportError:
            pass


@receiver(pre_save, sender=ScheduledNotification)
def scheduled_notification_updated(sender, instance, **kwargs):
    """Handle scheduled notification updates"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            
            # If schedule time changed, reschedule
            if old_instance.scheduled_for != instance.scheduled_for:
                try:
                    from apps.notifications.tasks import reschedule_notification_task
                    reschedule_notification_task.delay(instance.id, instance.scheduled_for)
                except ImportError:
                    pass
                    
            # If status changed to cancelled, cancel the task
            if (old_instance.status != instance.status and 
                instance.status == ScheduledNotification.Status.CANCELLED):
                try:
                    from apps.notifications.tasks import cancel_notification_task
                    cancel_notification_task.delay(instance.id)
                except ImportError:
                    pass
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=NotificationLog)
def notification_log_created(sender, instance, created, **kwargs):
    """Handle notification log creation"""
    if created:
        # Update notification status based on delivery result
        if instance.notification:
            if instance.status == NotificationLog.Status.DELIVERED:
                instance.notification.status = Notification.Status.SENT
            elif instance.status == NotificationLog.Status.FAILED:
                instance.notification.status = Notification.Status.FAILED
                
                # Retry logic if needed
                if instance.notification.retry_count < instance.notification.max_retries:
                    instance.notification.retry_count += 1
                    instance.notification.status = Notification.Status.PENDING
                    
                    # Schedule retry
                    try:
                        from apps.notifications.tasks import retry_notification_task
                        retry_notification_task.apply_async(
                            args=[instance.notification.id],
                            countdown=300  # Retry after 5 minutes
                        )
                    except ImportError:
                        pass
            
            instance.notification.save()


@receiver(post_save, sender=NotificationSetting)
def notification_setting_changed(sender, instance, created, **kwargs):
    """Handle notification setting changes"""
    if not created:
        # Cancel scheduled notifications if user disabled them
        if not instance.enabled:
            from .models import ScheduledNotification
            ScheduledNotification.objects.filter(
                user=instance.user,
                notification_type=instance.notification_type,
                status=ScheduledNotification.Status.SCHEDULED
            ).update(status=ScheduledNotification.Status.CANCELLED)

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import APIKey, APIRequest, WebhookDelivery, APIRateLimit


@receiver(post_save, sender=APIKey)
def api_key_created(sender, instance, created, **kwargs):
    """Handle API key creation"""
    if created:
        # Send API key created notification to user
        try:
            from apps.notifications.tasks import send_api_key_notification
            send_api_key_notification.delay(instance.id)
        except ImportError:
            pass


@receiver(pre_save, sender=APIKey)
def api_key_status_changed(sender, instance, **kwargs):
    """Handle API key status changes"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Send status change notification
                try:
                    from apps.notifications.tasks import send_api_key_status_update
                    send_api_key_status_update.delay(instance.id, old_instance.status, instance.status)
                except ImportError:
                    pass
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=APIRequest)
def api_request_logged(sender, instance, created, **kwargs):
    """Handle API request logging"""
    if created and instance.api_key:
        # Update API key usage
        instance.api_key.record_usage()
        
        # Update rate limits
        rate_limit, created = APIRateLimit.objects.get_or_create(
            api_key=instance.api_key,
            endpoint=instance.endpoint,
            defaults={
                'minute_reset': timezone.now() + timezone.timedelta(minutes=1),
                'hour_reset': timezone.now() + timezone.timedelta(hours=1),
                'day_reset': timezone.now() + timezone.timedelta(days=1),
            }
        )
        rate_limit.increment_counts()


@receiver(post_save, sender=WebhookDelivery)
def webhook_delivery_completed(sender, instance, created, **kwargs):
    """Handle webhook delivery completion"""
    if not created:
        # Update endpoint status based on delivery results
        if instance.status == WebhookDelivery.Status.DELIVERED:
            instance.endpoint.record_success()
        elif instance.status == WebhookDelivery.Status.FAILED:
            instance.endpoint.record_failure()
            
            # Schedule retry if possible
            if instance.can_retry():
                instance.schedule_retry()
                
                # Send retry notification
                try:
                    from apps.notifications.tasks import send_webhook_retry_notification
                    send_webhook_retry_notification.delay(instance.id)
                except ImportError:
                    pass

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import DeliveryDocument, DeliveryItem, ReturnDocument


@receiver(post_save, sender=DeliveryDocument)
def delivery_document_created(sender, instance, created, **kwargs):
    """Handle delivery document creation"""
    if created:
        # Update order status when delivery is created
        if instance.order:
            from apps.orders.models import Order
            if instance.document_type == DeliveryDocument.DocumentType.DELIVERY:
                instance.order.status = Order.Status.OUT_FOR_DELIVERY
            elif instance.document_type == DeliveryDocument.DocumentType.PICKUP:
                instance.order.status = Order.Status.SCHEDULED_FOR_PICKUP
            instance.order.save()
        
        # Send notification to customer
        try:
            from apps.notifications.tasks import send_delivery_notification
            send_delivery_notification.delay(instance.id)
        except ImportError:
            pass


@receiver(pre_save, sender=DeliveryDocument)
def delivery_status_changed(sender, instance, **kwargs):
    """Handle delivery status changes"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Update timestamps based on status
                if instance.status == DeliveryDocument.Status.IN_TRANSIT:
                    instance.dispatched_at = timezone.now()
                elif instance.status == DeliveryDocument.Status.DELIVERED:
                    instance.delivered_at = timezone.now()
                    
                    # Update order status
                    if instance.order:
                        from apps.orders.models import Order
                        if instance.document_type == DeliveryDocument.DocumentType.DELIVERY:
                            instance.order.status = Order.Status.DELIVERED
                        elif instance.document_type == DeliveryDocument.DocumentType.PICKUP:
                            instance.order.status = Order.Status.RETURNED
                        instance.order.save()
                
                # Send status update notification
                try:
                    from apps.notifications.tasks import send_delivery_status_update
                    send_delivery_status_update.delay(instance.id, old_instance.status, instance.status)
                except ImportError:
                    pass
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=ReturnDocument)
def return_document_created(sender, instance, created, **kwargs):
    """Handle return document creation"""
    if created:
        # Update order status
        if instance.order:
            from apps.orders.models import Order
            instance.order.status = Order.Status.RETURN_INITIATED
            instance.order.save()
        
        # Send return notification
        try:
            from apps.notifications.tasks import send_return_notification
            send_return_notification.delay(instance.id)
        except ImportError:
            pass


@receiver(pre_save, sender=ReturnDocument)
def return_status_changed(sender, instance, **kwargs):
    """Handle return status changes"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Update timestamps
                if instance.status == ReturnDocument.Status.COMPLETED:
                    instance.completed_at = timezone.now()
                    
                    # Update order status
                    if instance.order:
                        from apps.orders.models import Order
                        instance.order.status = Order.Status.RETURNED
                        instance.order.save()
                
                # Send status update notification
                try:
                    from apps.notifications.tasks import send_return_status_update
                    send_return_status_update.delay(instance.id, old_instance.status, instance.status)
                except ImportError:
                    pass
        except sender.DoesNotExist:
            pass

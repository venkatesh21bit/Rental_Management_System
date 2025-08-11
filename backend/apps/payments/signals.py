from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.db import models
from .models import Payment, PaymentRefund, WebhookEvent


@receiver(post_save, sender=Payment)
def payment_created(sender, instance, created, **kwargs):
    """Handle payment creation"""
    if created:
        # Update related invoice if exists
        if instance.invoice:
            # Check if invoice is fully paid
            total_payments = Payment.objects.filter(
                invoice=instance.invoice,
                status=Payment.Status.COMPLETED
            ).aggregate(total=models.Sum('amount'))['total'] or 0
            
            if total_payments >= instance.invoice.total_amount:
                from apps.invoicing.models import Invoice
                instance.invoice.status = Invoice.Status.PAID
                instance.invoice.paid_at = timezone.now()
                instance.invoice.save()
            elif total_payments > 0:
                from apps.invoicing.models import Invoice
                instance.invoice.status = Invoice.Status.PARTIALLY_PAID
                instance.invoice.save()
        
        # Send payment confirmation notification
        try:
            from apps.notifications.tasks import send_payment_notification
            send_payment_notification.delay(instance.id)
        except ImportError:
            pass


@receiver(pre_save, sender=Payment)
def payment_status_changed(sender, instance, **kwargs):
    """Handle payment status changes"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Update payment date when completed
                if instance.status == Payment.Status.COMPLETED:
                    instance.paid_at = timezone.now()
                    
                    # Update order status if linked
                    if instance.customer and hasattr(instance, 'order'):
                        from apps.orders.models import Order
                        order = Order.objects.filter(customer=instance.customer).first()
                        if order:
                            order.status = Order.Status.PAID
                            order.save()
                
                # Send payment status update notification
                try:
                    from apps.notifications.tasks import send_payment_status_update
                    send_payment_status_update.delay(instance.id, old_instance.status, instance.status)
                except ImportError:
                    pass
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=PaymentRefund)
def refund_created(sender, instance, created, **kwargs):
    """Handle refund creation"""
    if created:
        # Update original payment status
        if instance.payment:
            if instance.amount >= instance.payment.amount:
                instance.payment.status = Payment.Status.REFUNDED
            else:
                # Create a custom status or handle partial refunds
                pass
            instance.payment.save()
        
        # Send refund notification
        try:
            from apps.notifications.tasks import send_refund_notification
            send_refund_notification.delay(instance.id)
        except ImportError:
            pass


@receiver(post_save, sender=WebhookEvent)
def webhook_received(sender, instance, created, **kwargs):
    """Handle incoming webhook events"""
    if created:
        # Process webhook based on event type
        try:
            from apps.payments.tasks import process_webhook_event
            process_webhook_event.delay(instance.id)
        except ImportError:
            # Fallback to synchronous processing
            from apps.payments.services import PaymentWebhookService
            service = PaymentWebhookService()
            service.process_webhook(instance)

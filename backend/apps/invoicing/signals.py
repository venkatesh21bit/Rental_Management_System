from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.db import models
from .models import Invoice, InvoiceLine, Payment, CreditNote


@receiver(post_save, sender=Invoice)
def invoice_created(sender, instance, created, **kwargs):
    """Handle invoice creation"""
    if created:
        # Send invoice notification to customer
        try:
            from apps.notifications.tasks import send_invoice_notification
            send_invoice_notification.delay(instance.id)
        except ImportError:
            pass
        
        # Update order status if linked
        if instance.order:
            from apps.orders.models import Order
            instance.order.status = Order.Status.INVOICED
            instance.order.save()


@receiver(pre_save, sender=Invoice)
def invoice_status_changed(sender, instance, **kwargs):
    """Handle invoice status changes"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Update payment date when paid
                if instance.status == Invoice.Status.PAID:
                    instance.paid_at = timezone.now()
                    
                    # Update order status
                    if instance.order:
                        from apps.orders.models import Order
                        instance.order.status = Order.Status.PAID
                        instance.order.save()
                
                # Send status update notification
                try:
                    from apps.notifications.tasks import send_invoice_status_update
                    send_invoice_status_update.delay(instance.id, old_instance.status, instance.status)
                except ImportError:
                    pass
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=Payment)
def payment_received(sender, instance, created, **kwargs):
    """Handle payment receipt"""
    if created and instance.invoice:
        # Check if invoice is fully paid
        total_payments = Payment.objects.filter(
            invoice=instance.invoice,
            status=Payment.Status.COMPLETED
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        if total_payments >= instance.invoice.total_amount:
            instance.invoice.status = Invoice.Status.PAID
            instance.invoice.paid_at = timezone.now()
            instance.invoice.save()
        elif total_payments > 0:
            instance.invoice.status = Invoice.Status.PARTIALLY_PAID
            instance.invoice.save()


@receiver(post_save, sender=CreditNote)
def credit_note_created(sender, instance, created, **kwargs):
    """Handle credit note creation"""
    if created:
        # Update original invoice if linked
        if instance.original_invoice:
            # Recalculate invoice balance
            total_credits = CreditNote.objects.filter(
                original_invoice=instance.original_invoice,
                status=CreditNote.Status.APPROVED
            ).aggregate(total=models.Sum('amount'))['total'] or 0
            
            remaining_balance = instance.original_invoice.total_amount - total_credits
            
            if remaining_balance <= 0:
                instance.original_invoice.status = Invoice.Status.PAID
                instance.original_invoice.paid_at = timezone.now()
            elif remaining_balance < instance.original_invoice.total_amount:
                instance.original_invoice.status = Invoice.Status.PARTIALLY_PAID
            
            instance.original_invoice.save()
        
        # Send credit note notification
        try:
            from apps.notifications.tasks import send_credit_note_notification
            send_credit_note_notification.delay(instance.id)
        except ImportError:
            pass


@receiver(pre_save, sender=Invoice)
def update_invoice_calculations(sender, instance, **kwargs):
    """Update invoice calculations before saving"""
    if instance.pk:
        # Recalculate totals from invoice lines
        from django.db.models import Sum
        lines_total = InvoiceLine.objects.filter(
            invoice=instance
        ).aggregate(
            subtotal=Sum('total_amount')
        )['subtotal'] or 0
        
        instance.subtotal = lines_total
        
        # Calculate tax
        tax_amount = instance.subtotal * (instance.tax_rate / 100) if instance.tax_rate else 0
        instance.tax_amount = tax_amount
        
        # Calculate total
        instance.total_amount = instance.subtotal + tax_amount

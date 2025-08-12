"""
Celery tasks for sending email notifications.
This module handles automated email notifications for various events in the rental system.
"""

from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import logging

from apps.orders.models import RentalOrder
from apps.payments.models import Payment
from apps.deliveries.models import DeliveryDocument
from apps.notifications.models import NotificationTemplate, Notification, NotificationLog
from utils.email_service import email_service

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_order_confirmation_email(self, order_id):
    """Send order confirmation email to customer"""
    try:
        order = RentalOrder.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            logger.warning(f"No email found for customer {order.customer.id} in order {order_id}")
            return False
        
        # Prepare context for email
        context = {
            'order': {
                'id': str(order.id),
                'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
                'start_date': order.rental_start.strftime('%Y-%m-%d'),
                'end_date': order.rental_end.strftime('%Y-%m-%d'),
                'total_amount': str(order.total_amount),
                'status': order.status,
                'items': [
                    {
                        'product_name': item.product.name,
                        'quantity': item.quantity,
                        'rate': str(item.unit_price),
                        'subtotal': str(item.line_total)
                    }
                    for item in order.items.all()
                ]
            },
            'user': {
                'first_name': order.customer.first_name or 'Valued Customer',
                'last_name': order.customer.last_name or '',
                'email': order.customer.email
            }
        }
        
        # Send email
        success = email_service.send_notification_email(
            to_email=order.customer.email,
            subject=f"Order Confirmation - #{order.id}",
            template_name='order_confirmation',
            context=context,
            user=order.customer,
            notification_type='ORDER_CONFIRMATION'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=order.customer,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'order_id': order_id,
                'template': 'order_confirmation',
                'task_id': str(self.request.id)
            }
        )
        
        if success:
            logger.info(f"Order confirmation email sent for order {order_id}")
        else:
            logger.error(f"Failed to send order confirmation email for order {order_id}")
            
        return success
        
    except RentalOrder.DoesNotExist:
        logger.error(f"Order {order_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending order confirmation email for order {order_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_pickup_reminder_email(self, order_id):
    """Send pickup reminder email to customer"""
    try:
        order = RentalOrder.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(order.id),
                'start_date': order.rental_start.strftime('%Y-%m-%d'),
                'end_date': order.rental_end.strftime('%Y-%m-%d')
            },
            'user': {
                'first_name': order.customer.first_name or 'Valued Customer'
            },
            'pickup_time': '10:00 AM - 6:00 PM',
            'pickup_address': 'Our Store Location - Please contact us for exact address'
        }
        
        success = email_service.send_notification_email(
            to_email=order.customer.email,
            subject=f"Pickup Reminder - Order #{order.id}",
            template_name='pickup_reminder',
            context=context,
            user=order.customer,
            notification_type='PICKUP_REMINDER'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=order.customer,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'order_id': order_id,
                'template': 'pickup_reminder',
                'task_id': str(self.request.id)
            }
        )
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending pickup reminder for order {order_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_return_reminder_email(self, order_id):
    """Send return reminder email to customer"""
    try:
        order = RentalOrder.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(order.id),
                'end_date': order.rental_end.strftime('%Y-%m-%d')
            },
            'user': {
                'first_name': order.customer.first_name or 'Valued Customer'
            },
            'return_time': '10:00 AM - 6:00 PM',
            'return_address': 'Our Store Location - Please contact us for exact address'
        }
        
        success = email_service.send_notification_email(
            to_email=order.customer.email,
            subject=f"Return Reminder - Order #{order.id}",
            template_name='return_reminder',
            context=context,
            user=order.customer,
            notification_type='RETURN_REMINDER'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=order.customer,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'order_id': order_id,
                'template': 'return_reminder',
                'task_id': str(self.request.id)
            }
        )
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending return reminder for order {order_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_overdue_notice_email(self, order_id, days_overdue, late_fee=0):
    """Send overdue notice email to customer"""
    try:
        order = RentalOrder.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(order.id),
                'end_date': order.rental_end.strftime('%Y-%m-%d')
            },
            'user': {
                'first_name': order.customer.first_name or 'Valued Customer'
            },
            'days_overdue': days_overdue,
            'late_fee': str(late_fee)
        }
        
        success = email_service.send_notification_email(
            to_email=order.customer.email,
            subject=f"URGENT: Overdue Return Notice - Order #{order.id}",
            template_name='overdue_notice',
            context=context,
            user=order.customer,
            notification_type='OVERDUE_NOTICE'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=order.customer,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'order_id': order_id,
                'template': 'overdue_notice',
                'days_overdue': days_overdue,
                'late_fee': late_fee,
                'task_id': str(self.request.id)
            }
        )
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending overdue notice for order {order_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_payment_confirmation_email(self, payment_id):
    """Send payment confirmation email to customer"""
    try:
        payment = Payment.objects.select_related('order', 'order__customer').get(id=payment_id)
        
        if not payment.invoice.order.customer.user.email:
            return False
        
        context = {
            'payment': {
                'transaction_id': payment.gateway_payment_id,
                'amount': str(payment.amount),
                'method': payment.get_payment_method_display(),
                'created_at': payment.created_at.strftime('%Y-%m-%d %H:%M')
            },
            'order': {
                'id': str(payment.invoice.order.id)
            },
            'user': {
                'first_name': payment.invoice.order.customer.user.first_name or 'Valued Customer'
            }
        }
        
        success = email_service.send_notification_email(
            to_email=payment.invoice.order.customer.user.email,
            subject=f"Payment Confirmation - Transaction #{payment.gateway_payment_id}",
            template_name='payment_confirmation',
            context=context,
            user=payment.invoice.order.customer.user,
            notification_type='PAYMENT_CONFIRMATION'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=payment.invoice.order.customer.user,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'payment_id': payment_id,
                'order_id': payment.order.id,
                'template': 'payment_confirmation',
                'task_id': str(self.request.id)
            }
        )
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending payment confirmation for payment {payment_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_payment_reminder_email(self, order_id, amount_due):
    """Send payment reminder email to customer"""
    try:
        order = RentalOrder.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(order.id)
            },
            'user': {
                'first_name': order.customer.first_name or 'Valued Customer'
            },
            'amount_due': str(amount_due),
            'due_date': (timezone.now() + timedelta(days=3)).strftime('%Y-%m-%d')
        }
        
        success = email_service.send_notification_email(
            to_email=order.customer.email,
            subject=f"Payment Reminder - Order #{order.id}",
            template_name='payment_reminder',
            context=context,
            user=order.customer,
            notification_type='PAYMENT_REMINDER'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=order.customer,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'order_id': order_id,
                'template': 'payment_reminder',
                'amount_due': amount_due,
                'task_id': str(self.request.id)
            }
        )
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending payment reminder for order {order_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_delivery_update_email(self, delivery_id, status_update, message):
    """Send delivery update email to customer"""
    try:
        delivery = DeliveryDocument.objects.select_related('reservation', 'reservation__order', 'reservation__order__customer').get(id=delivery_id)
        
        if not delivery.reservation.order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(delivery.reservation.order.id)
            },
            'user': {
                'first_name': delivery.reservation.order.customer.first_name or 'Valued Customer'
            },
            'delivery_status': status_update,
            'delivery_message': message,
            'expected_delivery': delivery.scheduled_datetime.strftime('%Y-%m-%d') if delivery.scheduled_datetime else 'As scheduled'
        }
        
        success = email_service.send_notification_email(
            to_email=delivery.reservation.order.customer.email,
            subject=f"Delivery Update - Order #{delivery.reservation.order.id}",
            template_name='delivery_update',
            context=context,
            user=delivery.reservation.order.customer,
            notification_type='DELIVERY_UPDATE'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=delivery.reservation.order.customer,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'delivery_id': delivery_id,
                'order_id': delivery.reservation.order.id,
                'template': 'delivery_update',
                'status_update': status_update,
                'task_id': str(self.request.id)
            }
        )
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending delivery update for delivery {delivery_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_welcome_email(self, user_id):
    """Send welcome email to new user"""
    try:
        user = User.objects.get(id=user_id)
        
        if not user.email:
            return False
        
        context = {
            'user': {
                'first_name': user.first_name or 'Valued Customer',
                'email': user.email
            }
        }
        
        success = email_service.send_notification_email(
            to_email=user.email,
            subject="Welcome to Rental Management System!",
            template_name='welcome',
            context=context,
            user=user,
            notification_type='WELCOME'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=user,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'template': 'welcome',
                'task_id': str(self.request.id)
            }
        )
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending welcome email for user {user_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task
def check_upcoming_pickups():
    """Check for orders with upcoming pickup dates and send reminders"""
    tomorrow = timezone.now().date() + timedelta(days=1)
    
    upcoming_orders = RentalOrder.objects.filter(
        rental_start__date=tomorrow,
        status__in=['CONFIRMED', 'RESERVED']
    ).select_related('customer')
    
    sent_count = 0
    for order in upcoming_orders:
        # Check if reminder already sent
        existing_log = NotificationLog.objects.filter(
            user=order.customer,
            channel='EMAIL',
            metadata__contains={'order_id': order.id, 'template': 'pickup_reminder'}
        ).exists()
        
        if not existing_log:
            send_pickup_reminder_email.delay(order.id)
            sent_count += 1
    
    logger.info(f"Sent {sent_count} pickup reminder emails")
    return sent_count


@shared_task
def check_upcoming_returns():
    """Check for orders with upcoming return dates and send reminders"""
    tomorrow = timezone.now().date() + timedelta(days=1)
    
    upcoming_returns = RentalOrder.objects.filter(
        rental_end__date=tomorrow,
        status__in=['ACTIVE', 'PICKED_UP']
    ).select_related('customer')
    
    sent_count = 0
    for order in upcoming_returns:
        # Check if reminder already sent
        existing_log = NotificationLog.objects.filter(
            user=order.customer,
            channel='EMAIL',
            metadata__contains={'order_id': order.id, 'template': 'return_reminder'}
        ).exists()
        
        if not existing_log:
            send_return_reminder_email.delay(order.id)
            sent_count += 1
    
    logger.info(f"Sent {sent_count} return reminder emails")
    return sent_count


@shared_task
def check_overdue_returns():
    """Check for overdue returns and send overdue notices"""
    today = timezone.now().date()
    
    overdue_orders = RentalOrder.objects.filter(
        rental_end__date__lt=today,
        status__in=['ACTIVE', 'PICKED_UP']
    ).select_related('customer')
    
    sent_count = 0
    for order in overdue_orders:
        days_overdue = (today - order.rental_end.date()).days
        
        # Send overdue notice every 3 days
        if days_overdue % 3 == 0:
            late_fee = days_overdue * 100  # ₹100 per day late fee
            send_overdue_notice_email.delay(order.id, days_overdue, late_fee)
            sent_count += 1
    
    logger.info(f"Sent {sent_count} overdue notice emails")
    return sent_count

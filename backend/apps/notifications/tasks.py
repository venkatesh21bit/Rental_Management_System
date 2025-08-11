"""
Celery tasks for sending email notifications.
This module handles automated email notifications for various events in the rental system.
"""

from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import logging

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.deliveries.models import Delivery
from apps.notifications.models import NotificationTemplate, Notification, NotificationLog
from utils.email_service import email_service

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_order_confirmation_email(self, order_id):
    """Send order confirmation email to customer"""
    try:
        order = Order.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            logger.warning(f"No email found for customer {order.customer.id} in order {order_id}")
            return False
        
        # Prepare context for email
        context = {
            'order': {
                'id': str(order.id),
                'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
                'start_date': order.start_date.strftime('%Y-%m-%d'),
                'end_date': order.end_date.strftime('%Y-%m-%d'),
                'total_amount': str(order.total_amount),
                'status': order.status,
                'items': [
                    {
                        'product_name': item.product.name,
                        'quantity': item.quantity,
                        'rate': str(item.rate),
                        'subtotal': str(item.quantity * item.rate)
                    }
                    for item in order.orderitem_set.all()
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
        
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending order confirmation email for order {order_id}: {str(e)}")
        raise self.retry(exc=e)


@shared_task(bind=True, retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_pickup_reminder_email(self, order_id):
    """Send pickup reminder email to customer"""
    try:
        order = Order.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(order.id),
                'start_date': order.start_date.strftime('%Y-%m-%d'),
                'end_date': order.end_date.strftime('%Y-%m-%d')
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
        order = Order.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(order.id),
                'end_date': order.end_date.strftime('%Y-%m-%d')
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
        order = Order.objects.select_related('customer').get(id=order_id)
        
        if not order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(order.id),
                'end_date': order.end_date.strftime('%Y-%m-%d')
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
        
        if not payment.order.customer.email:
            return False
        
        context = {
            'payment': {
                'transaction_id': payment.transaction_id,
                'amount': str(payment.amount),
                'method': payment.method,
                'created_at': payment.created_at.strftime('%Y-%m-%d %H:%M')
            },
            'order': {
                'id': str(payment.order.id)
            },
            'user': {
                'first_name': payment.order.customer.first_name or 'Valued Customer'
            }
        }
        
        success = email_service.send_notification_email(
            to_email=payment.order.customer.email,
            subject=f"Payment Confirmation - Transaction #{payment.transaction_id}",
            template_name='payment_confirmation',
            context=context,
            user=payment.order.customer,
            notification_type='PAYMENT_CONFIRMATION'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=payment.order.customer,
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
        order = Order.objects.select_related('customer').get(id=order_id)
        
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
        delivery = Delivery.objects.select_related('order', 'order__customer').get(id=delivery_id)
        
        if not delivery.order.customer.email:
            return False
        
        context = {
            'order': {
                'id': str(delivery.order.id)
            },
            'user': {
                'first_name': delivery.order.customer.first_name or 'Valued Customer'
            },
            'delivery_status': status_update,
            'delivery_message': message,
            'expected_delivery': delivery.expected_delivery_date.strftime('%Y-%m-%d') if delivery.expected_delivery_date else 'As scheduled'
        }
        
        success = email_service.send_notification_email(
            to_email=delivery.order.customer.email,
            subject=f"Delivery Update - Order #{delivery.order.id}",
            template_name='delivery_update',
            context=context,
            user=delivery.order.customer,
            notification_type='DELIVERY_UPDATE'
        )
        
        # Log notification
        NotificationLog.objects.create(
            user=delivery.order.customer,
            channel='EMAIL',
            status='SENT' if success else 'FAILED',
            metadata={
                'delivery_id': delivery_id,
                'order_id': delivery.order.id,
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
    
    upcoming_orders = Order.objects.filter(
        start_date=tomorrow,
        status__in=['CONFIRMED', 'PAID']
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
    
    upcoming_returns = Order.objects.filter(
        end_date=tomorrow,
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
    
    overdue_orders = Order.objects.filter(
        end_date__lt=today,
        status__in=['ACTIVE', 'PICKED_UP']
    ).select_related('customer')
    
    sent_count = 0
    for order in overdue_orders:
        days_overdue = (today - order.end_date).days
        
        # Send overdue notice every 3 days
        if days_overdue % 3 == 0:
            late_fee = days_overdue * 100  # ₹100 per day late fee
            send_overdue_notice_email.delay(order.id, days_overdue, late_fee)
            sent_count += 1
    
    logger.info(f"Sent {sent_count} overdue notice emails")
    return sent_count

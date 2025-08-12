from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal
import uuid
import logging

from apps.orders.models import RentalOrder
from apps.invoicing.models import Invoice
from apps.payments.models import Payment, PaymentProvider

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order_payment(request, order_id=None):
    """Create a payment for an order"""
    try:
        # Get order_id from URL parameter or request body
        if not order_id:
            order_id = request.data.get('order_id')
        
        if not order_id:
            return Response({
                'success': False,
                'error': 'Order ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the order
        order = get_object_or_404(RentalOrder, id=order_id)
        
        # Check if user can pay for this order
        if not request.user.is_staff and order.customer != request.user:
            return Response({
                'success': False,
                'error': 'You can only pay for your own orders'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get payment data from request
        payment_method = request.data.get('payment_method', 'CREDIT_CARD')
        provider_name = request.data.get('provider')
        provider_id = request.data.get('provider_id')
        
        # Get payment provider (by name or ID)
        provider = None
        if provider_id:
            provider = get_object_or_404(PaymentProvider, id=provider_id, is_active=True)
        elif provider_name:
            provider = PaymentProvider.objects.filter(name__iexact=provider_name, is_active=True).first()
        
        if not provider:
            provider = PaymentProvider.objects.filter(is_active=True).first()
            
        if not provider:
            return Response({
                'success': False,
                'error': 'No payment provider available'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create or get invoice for the order
        invoice, created = Invoice.objects.get_or_create(
            order=order,
            defaults={
                'customer': order.customer,
                'invoice_number': f'INV-{order.order_number}',
                'due_date': order.rental_start,
                'subtotal': order.subtotal,
                'tax_amount': order.tax_amount,
                'discount_amount': order.discount_amount,
                'total_amount': order.total_amount,
                'currency': order.currency,
                'status': 'DRAFT'
            }
        )
        
        # Check if order is already paid
        existing_payment = Payment.objects.filter(
            invoice=invoice,
            status__in=['COMPLETED', 'PROCESSING']
        ).first()
        
        if existing_payment:
            return Response({
                'success': False,
                'error': 'Order is already paid or payment is in progress',
                'payment_id': str(existing_payment.id)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment record
        payment = Payment.objects.create(
            invoice=invoice,
            customer=order.customer,
            provider=provider,
            payment_method=payment_method,
            amount=order.total_amount,
            currency=order.currency,
            description=f'Payment for order {order.order_number}',
            status='PENDING'
        )
        
        # Update invoice status
        invoice.status = 'SENT'
        invoice.save()
        
        # For demo purposes, we'll simulate different payment scenarios
        if provider.provider_type == 'STRIPE':
            # Simulate Stripe payment flow
            payment_response = {
                'payment_id': str(payment.id),
                'payment_url': f'/api/payments/{payment.id}/stripe-checkout/',
                'client_secret': f'pi_{uuid.uuid4().hex}_secret_{uuid.uuid4().hex[:10]}',
                'requires_action': False
            }
        elif provider.provider_type == 'RAZORPAY':
            # Simulate Razorpay payment flow
            payment_response = {
                'payment_id': str(payment.id),
                'razorpay_order_id': f'order_{uuid.uuid4().hex[:10]}',
                'razorpay_key': 'rzp_test_' + uuid.uuid4().hex[:10],
                'amount': int(order.total_amount * 100),  # Razorpay expects amount in paise
                'currency': order.currency
            }
        else:
            # Generic payment response
            payment_response = {
                'payment_id': str(payment.id),
                'payment_url': f'/api/payments/{payment.id}/pay/',
                'amount': str(order.total_amount),
                'currency': order.currency
            }
        
        return Response({
            'success': True,
            'message': 'Payment created successfully',
            'data': {
                'order_id': str(order.id),
                'order_number': order.order_number,
                'invoice_id': str(invoice.id),
                'amount': str(order.total_amount),
                'currency': order.currency,
                'provider': {
                    'id': str(provider.id),
                    'name': provider.name,
                    'type': provider.provider_type
                },
                'payment': payment_response
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating payment for order {order_id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while creating payment'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_payment(request, payment_id):
    """Complete a payment (simulate payment success)"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        # Check if user can complete this payment
        if not request.user.is_staff and payment.customer != request.user:
            return Response({
                'success': False,
                'error': 'You can only complete your own payments'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if payment is still pending
        if payment.status != 'PENDING':
            return Response({
                'success': False,
                'error': f'Payment is already {payment.status.lower()}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Simulate payment completion
        transaction_id = request.data.get('transaction_id', f'txn_{uuid.uuid4().hex[:10]}')
        
        payment.gateway_payment_id = transaction_id
        payment.status = 'COMPLETED'
        payment.completed_at = timezone.now()
        payment.save()
        
        # Update invoice
        invoice = payment.invoice
        invoice.status = 'PAID'
        invoice.paid_at = timezone.now()
        invoice.save()
        
        # Update order status
        order = invoice.order
        if order.status == 'CONFIRMED':
            order.status = 'PAID'
            order.save()
        
        # Send payment confirmation email
        try:
            from utils.email_service import email_service
            from apps.notifications.models import NotificationLog
            
            context = {
                'payment': {
                    'transaction_id': payment.gateway_payment_id,
                    'amount': str(payment.amount),
                    'method': payment.get_payment_method_display(),
                    'created_at': payment.completed_at.strftime('%Y-%m-%d %H:%M')
                },
                'order': {
                    'id': str(order.id),
                    'order_number': order.order_number
                },
                'user': {
                    'first_name': order.customer.first_name or 'Valued Customer'
                }
            }
            
            email_success = email_service.send_notification_email(
                to_email=order.customer.email,
                subject=f"Payment Confirmation - #{payment.payment_number}",
                template_name='payment_confirmation',
                context=context,
                user=order.customer,
                notification_type='PAYMENT_CONFIRMATION'
            )
            
            # Log the email attempt
            NotificationLog.objects.create(
                user=order.customer,
                channel='EMAIL',
                status='SENT' if email_success else 'FAILED',
                metadata={
                    'payment_id': str(payment.id),
                    'template': 'payment_confirmation',
                    'method': 'synchronous'
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to send payment confirmation email: {str(e)}")
        
        return Response({
            'success': True,
            'message': 'Payment completed successfully',
            'data': {
                'payment_id': str(payment.id),
                'transaction_id': payment.gateway_payment_id,
                'amount': str(payment.amount),
                'currency': payment.currency,
                'status': payment.status,
                'completed_at': payment.completed_at.isoformat(),
                'order': {
                    'id': str(order.id),
                    'order_number': order.order_number,
                    'status': order.status
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error completing payment {payment_id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while completing payment'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_providers(request):
    """Get available payment providers"""
    try:
        providers = PaymentProvider.objects.filter(is_active=True).values(
            'id', 'name', 'provider_type', 'description', 'logo_url'
        )
        
        return Response({
            'success': True,
            'data': list(providers)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching payment providers: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while fetching payment providers'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_payment_status(request, order_id=None):
    """Get payment status for an order"""
    try:
        # Get order_id from URL parameter or query parameter
        if not order_id:
            order_id = request.GET.get('order_id')
        
        if not order_id:
            return Response({
                'success': False,
                'error': 'Order ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order = get_object_or_404(RentalOrder, id=order_id)
        
        # Check if user can view this order
        if not request.user.is_staff and order.customer != request.user:
            return Response({
                'success': False,
                'error': 'You can only view your own orders'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get invoice and payments
        try:
            invoice = Invoice.objects.get(order=order)
            payments = Payment.objects.filter(invoice=invoice).order_by('-created_at')
            
            payment_data = []
            for payment in payments:
                payment_data.append({
                    'id': str(payment.id),
                    'payment_number': payment.payment_number,
                    'amount': str(payment.amount),
                    'currency': payment.currency,
                    'status': payment.status,
                    'payment_method': payment.payment_method,
                    'provider': payment.provider.name,
                    'transaction_id': payment.gateway_payment_id,
                    'created_at': payment.created_at.isoformat(),
                    'completed_at': payment.completed_at.isoformat() if payment.completed_at else None
                })
            
            return Response({
                'success': True,
                'data': {
                    'order_id': str(order.id),
                    'order_number': order.order_number,
                    'total_amount': str(order.total_amount),
                    'currency': order.currency,
                    'invoice_status': invoice.status,
                    'payments': payment_data,
                    'is_paid': invoice.status == 'PAID'
                }
            }, status=status.HTTP_200_OK)
            
        except Invoice.DoesNotExist:
            return Response({
                'success': True,
                'data': {
                    'order_id': str(order.id),
                    'order_number': order.order_number,
                    'total_amount': str(order.total_amount),
                    'currency': order.currency,
                    'invoice_status': 'NOT_CREATED',
                    'payments': [],
                    'is_paid': False
                }
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching payment status for order {order_id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while fetching payment status'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

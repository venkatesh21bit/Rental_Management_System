"""
Industry-grade webhook handling for payment gateways
Implements atomic transactions, signature verification, and duplicate prevention
"""

import logging
import json
import stripe
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.core.cache import cache
from .services import payment_service
from .models import WebhookEvent, Payment
from utils.email_service import email_service

logger = logging.getLogger(__name__)


class StripeWebhookView(View):
    """
    Secure Stripe webhook handler with atomic transactions
    Implements signature verification and duplicate prevention
    """
    
    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["POST"]))
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        """
        Handle Stripe webhook events with industry-grade security
        """
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
        
        if not endpoint_secret:
            logger.error("Stripe webhook secret not configured")
            return HttpResponse(status=400)
        
        try:
            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError as e:
            logger.error(f"Invalid payload in Stripe webhook: {e}")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature in Stripe webhook: {e}")
            return HttpResponse(status=400)
        
        # Extract event data
        event_id = event.get('id')
        event_type = event.get('type')
        event_data = event.get('data', {}).get('object', {})
        
        # Prevent duplicate processing using cache
        cache_key = f"webhook_processed_{event_id}"
        if cache.get(cache_key):
            logger.info(f"Webhook event {event_id} already processed")
            return HttpResponse(status=200)
        
        try:
            # Process webhook event with atomic transaction
            with transaction.atomic():
                # Log webhook event
                webhook_event = WebhookEvent.objects.create(
                    provider='STRIPE',
                    event_id=event_id,
                    event_type=event_type,
                    event_data=event,
                    processed=False,
                    received_at=timezone.now()
                )
                
                # Process based on event type
                success = self._process_stripe_event(event_type, event_data, webhook_event)
                
                if success:
                    webhook_event.processed = True
                    webhook_event.processed_at = timezone.now()
                    webhook_event.save()
                    
                    # Mark as processed in cache for 24 hours
                    cache.set(cache_key, True, 86400)
                    
                    logger.info(f"Successfully processed Stripe webhook {event_id} of type {event_type}")
                    return HttpResponse(status=200)
                else:
                    webhook_event.error_message = f"Failed to process event type: {event_type}"
                    webhook_event.save()
                    logger.error(f"Failed to process Stripe webhook {event_id} of type {event_type}")
                    return HttpResponse(status=400)
        
        except Exception as e:
            logger.error(f"Error processing Stripe webhook {event_id}: {str(e)}")
            return HttpResponse(status=500)
    
    def _process_stripe_event(self, event_type, event_data, webhook_event):
        """
        Process specific Stripe event types with atomic transactions
        """
        try:
            if event_type == 'payment_intent.succeeded':
                return self._handle_payment_succeeded(event_data, webhook_event)
            
            elif event_type == 'payment_intent.payment_failed':
                return self._handle_payment_failed(event_data, webhook_event)
            
            elif event_type == 'payment_intent.requires_action':
                return self._handle_payment_requires_action(event_data, webhook_event)
            
            elif event_type == 'payment_intent.canceled':
                return self._handle_payment_canceled(event_data, webhook_event)
            
            elif event_type == 'charge.dispute.created':
                return self._handle_dispute_created(event_data, webhook_event)
            
            elif event_type == 'invoice.payment_succeeded':
                return self._handle_invoice_payment_succeeded(event_data, webhook_event)
            
            elif event_type == 'invoice.payment_failed':
                return self._handle_invoice_payment_failed(event_data, webhook_event)
            
            elif event_type == 'charge.refunded':
                return self._handle_charge_refunded(event_data, webhook_event)
            
            else:
                logger.info(f"Unhandled Stripe event type: {event_type}")
                return True  # Return True for unhandled but valid events
        
        except Exception as e:
            logger.error(f"Error processing Stripe event {event_type}: {str(e)}")
            return False
    
    @transaction.atomic
    def _handle_payment_succeeded(self, event_data, webhook_event):
        """Handle successful payment with atomic transaction"""
        payment_intent_id = event_data.get('id')
        amount_received = event_data.get('amount_received', 0) / 100  # Convert cents to dollars
        currency = event_data.get('currency', 'usd').upper()
        
        try:
            payment = Payment.objects.select_for_update().get(
                gateway_payment_id=payment_intent_id
            )
            
            # Update payment status
            payment.status = Payment.Status.COMPLETED
            payment.paid_at = timezone.now()
            payment.gateway_response = event_data
            payment.save()
            
            # Update invoice if exists
            if payment.invoice:
                payment.invoice.payment_status = 'PAID'
                payment.invoice.paid_at = timezone.now()
                payment.invoice.save()
            
            # Send confirmation email
            if payment.customer and payment.customer.email:
                try:
                    email_service.send_notification_email(
                        to_email=payment.customer.email,
                        subject=f'Payment Confirmation - {payment.payment_number}',
                        template_name='payment_success',
                        context={
                            'payment': payment,
                            'amount': amount_received,
                            'currency': currency
                        },
                        user=payment.customer,
                        notification_type='PAYMENT_CONFIRMATION'
                    )
                except Exception as e:
                    logger.error(f"Failed to send payment confirmation email: {e}")
            
            logger.info(f"Payment {payment_intent_id} marked as completed")
            return True
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for payment_intent_id: {payment_intent_id}")
            return False
        except Exception as e:
            logger.error(f"Error handling payment success: {str(e)}")
            return False
    
    @transaction.atomic
    def _handle_payment_failed(self, event_data, webhook_event):
        """Handle failed payment with atomic transaction"""
        payment_intent_id = event_data.get('id')
        failure_reason = event_data.get('last_payment_error', {}).get('message', 'Payment failed')
        
        try:
            payment = Payment.objects.select_for_update().get(
                gateway_payment_id=payment_intent_id
            )
            
            # Update payment status
            payment.status = Payment.Status.FAILED
            payment.failure_reason = failure_reason
            payment.gateway_response = event_data
            payment.save()
            
            # Send failure notification email
            if payment.customer and payment.customer.email:
                try:
                    email_service.send_notification_email(
                        to_email=payment.customer.email,
                        subject=f'Payment Failed - {payment.payment_number}',
                        template_name='payment_failed',
                        context={
                            'payment': payment,
                            'failure_reason': failure_reason
                        },
                        user=payment.customer,
                        notification_type='PAYMENT_FAILED'
                    )
                except Exception as e:
                    logger.error(f"Failed to send payment failure email: {e}")
            
            logger.info(f"Payment {payment_intent_id} marked as failed: {failure_reason}")
            return True
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for payment_intent_id: {payment_intent_id}")
            return False
        except Exception as e:
            logger.error(f"Error handling payment failure: {str(e)}")
            return False
    
    @transaction.atomic
    def _handle_payment_requires_action(self, event_data, webhook_event):
        """Handle payment requiring additional action"""
        payment_intent_id = event_data.get('id')
        
        try:
            payment = Payment.objects.select_for_update().get(
                gateway_payment_id=payment_intent_id
            )
            
            # Update payment status
            payment.status = Payment.Status.REQUIRES_ACTION
            payment.gateway_response = event_data
            payment.save()
            
            logger.info(f"Payment {payment_intent_id} requires additional action")
            return True
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for payment_intent_id: {payment_intent_id}")
            return False
        except Exception as e:
            logger.error(f"Error handling payment requires action: {str(e)}")
            return False
    
    @transaction.atomic
    def _handle_payment_canceled(self, event_data, webhook_event):
        """Handle canceled payment with atomic transaction"""
        payment_intent_id = event_data.get('id')
        
        try:
            payment = Payment.objects.select_for_update().get(
                gateway_payment_id=payment_intent_id
            )
            
            # Update payment status
            payment.status = Payment.Status.CANCELED
            payment.gateway_response = event_data
            payment.save()
            
            logger.info(f"Payment {payment_intent_id} was canceled")
            return True
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for payment_intent_id: {payment_intent_id}")
            return False
        except Exception as e:
            logger.error(f"Error handling payment cancellation: {str(e)}")
            return False
    
    @transaction.atomic
    def _handle_dispute_created(self, event_data, webhook_event):
        """Handle dispute creation with atomic transaction"""
        charge_id = event_data.get('charge')
        dispute_reason = event_data.get('reason', 'Unknown')
        dispute_amount = event_data.get('amount', 0) / 100
        
        try:
            # Find payment by charge ID
            payment = Payment.objects.select_for_update().filter(
                gateway_response__charges__data__contains=[{'id': charge_id}]
            ).first()
            
            if payment:
                # Update payment with dispute information
                payment.status = Payment.Status.DISPUTED
                payment.gateway_response = payment.gateway_response or {}
                payment.gateway_response['dispute'] = event_data
                payment.save()
                
                # Notify admin about dispute
                try:
                    admin_email = getattr(settings, 'ADMIN_EMAIL', None)
                    if admin_email:
                        email_service.send_notification_email(
                            to_email=admin_email,
                            subject=f'Payment Dispute Created - {payment.payment_number}',
                            template_name='dispute_notification',
                            context={
                                'payment': payment,
                                'dispute_reason': dispute_reason,
                                'dispute_amount': dispute_amount
                            },
                            user=None,
                            notification_type='ADMIN_DISPUTE_NOTIFICATION'
                        )
                except Exception as e:
                    logger.error(f"Failed to send dispute notification email: {e}")
                
                logger.info(f"Dispute created for payment {payment.payment_number}")
                return True
            else:
                logger.warning(f"Payment not found for disputed charge: {charge_id}")
                return True  # Still return True as the webhook is valid
                
        except Exception as e:
            logger.error(f"Error handling dispute creation: {str(e)}")
            return False
    
    @transaction.atomic
    def _handle_invoice_payment_succeeded(self, event_data, webhook_event):
        """Handle invoice payment success"""
        invoice_id = event_data.get('id')
        subscription_id = event_data.get('subscription')
        
        logger.info(f"Invoice payment succeeded: {invoice_id}")
        # Additional logic for subscription payments can be added here
        return True
    
    @transaction.atomic
    def _handle_invoice_payment_failed(self, event_data, webhook_event):
        """Handle invoice payment failure"""
        invoice_id = event_data.get('id')
        
        logger.info(f"Invoice payment failed: {invoice_id}")
        # Additional logic for handling failed subscription payments
        return True
    
    @transaction.atomic
    def _handle_charge_refunded(self, event_data, webhook_event):
        """Handle charge refund with atomic transaction"""
        charge_id = event_data.get('id')
        refunds = event_data.get('refunds', {}).get('data', [])
        
        try:
            # Find payment by charge ID
            payment = Payment.objects.select_for_update().filter(
                gateway_response__charges__data__contains=[{'id': charge_id}]
            ).first()
            
            if payment:
                # Process each refund
                for refund_data in refunds:
                    refund_amount = refund_data.get('amount', 0) / 100
                    refund_id = refund_data.get('id')
                    
                    # Update or create refund record
                    from .models import PaymentRefund
                    refund, created = PaymentRefund.objects.update_or_create(
                        gateway_refund_id=refund_id,
                        defaults={
                            'payment': payment,
                            'amount': refund_amount,
                            'reason': refund_data.get('reason', 'Customer requested'),
                            'status': 'COMPLETED',
                            'gateway_response': refund_data,
                            'processed_at': timezone.now()
                        }
                    )
                    
                    logger.info(f"Refund {'created' if created else 'updated'}: {refund_id}")
                
                # Send refund confirmation email
                if payment.customer and payment.customer.email:
                    try:
                        total_refunded = sum(r.get('amount', 0) for r in refunds) / 100
                        email_service.send_notification_email(
                            to_email=payment.customer.email,
                            subject=f'Refund Processed - {payment.payment_number}',
                            template_name='refund_confirmation',
                            context={
                                'payment': payment,
                                'refunded_amount': total_refunded,
                                'currency': payment.currency
                            },
                            user=payment.customer,
                            notification_type='REFUND_CONFIRMATION'
                        )
                    except Exception as e:
                        logger.error(f"Failed to send refund confirmation email: {e}")
                
                return True
            else:
                logger.warning(f"Payment not found for refunded charge: {charge_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error handling charge refund: {str(e)}")
            return False


@csrf_exempt
@require_http_methods(["POST"])
def razorpay_webhook(request):
    """
    Handle Razorpay webhook events
    Can be extended for Razorpay integration
    """
    try:
        payload = json.loads(request.body)
        event_type = payload.get('event')
        
        # Basic webhook handling structure
        logger.info(f"Received Razorpay webhook: {event_type}")
        
        # Add Razorpay webhook signature verification here
        # Add event processing logic here
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Error processing Razorpay webhook: {str(e)}")
        return JsonResponse({'error': 'Webhook processing failed'}, status=400)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def webhook_health_check(request):
    """
    Health check endpoint for webhook monitoring
    """
    if request.method == 'GET':
        return JsonResponse({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'service': 'payment-webhooks'
        })
    
    # POST for testing webhook processing
    if request.method == 'POST':
        return JsonResponse({
            'status': 'test_received',
            'timestamp': timezone.now().isoformat()
        })

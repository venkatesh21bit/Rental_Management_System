"""
Industry-grade payment gateway service with Stripe integration
Provides atomic transactions, comprehensive error handling, and enterprise-level features
"""

import stripe
import logging
import uuid
from decimal import Decimal, ROUND_UP
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from django.conf import settings
from django.db import transaction, DatabaseError
from django.core.cache import cache
from django.utils import timezone
from django.core.exceptions import ValidationError
from dataclasses import dataclass
from enum import Enum

from .models import (
    PaymentProvider, Payment, PaymentRefund, WebhookEvent,
    PaymentLink, BankAccount
)
from apps.orders.models import RentalOrder
from apps.invoicing.models import Invoice
from utils.email_service import email_service

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
stripe.api_version = "2023-10-16"  # Use latest stable API version


class PaymentStatus(Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    REQUIRES_ACTION = "requires_action"
    REQUIRES_PAYMENT_METHOD = "requires_payment_method"
    SUCCEEDED = "succeeded"
    CANCELED = "canceled"
    FAILED = "failed"


class PaymentIntentStatus(Enum):
    """Stripe Payment Intent status mapping"""
    REQUIRES_PAYMENT_METHOD = "requires_payment_method"
    REQUIRES_CONFIRMATION = "requires_confirmation"
    REQUIRES_ACTION = "requires_action"
    PROCESSING = "processing"
    REQUIRES_CAPTURE = "requires_capture"
    CANCELED = "canceled"
    SUCCEEDED = "succeeded"


@dataclass
class PaymentRequest:
    """Payment request data structure"""
    amount: Decimal
    currency: str
    customer_id: str
    order_id: Optional[str] = None
    invoice_id: Optional[str] = None
    description: str = ""
    metadata: Dict[str, Any] = None
    payment_method: Optional[str] = None
    confirm: bool = False
    return_url: Optional[str] = None
    automatic_payment_methods: bool = True


@dataclass
class PaymentResponse:
    """Payment response data structure"""
    success: bool
    payment_intent_id: str
    client_secret: Optional[str] = None
    status: str = ""
    amount: Decimal = Decimal('0')
    currency: str = ""
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    requires_action: bool = False
    payment_method: Optional[Dict] = None
    metadata: Dict[str, Any] = None


@dataclass
class RefundRequest:
    """Refund request data structure"""
    payment_intent_id: str
    amount: Optional[Decimal] = None
    reason: str = ""
    metadata: Dict[str, Any] = None


@dataclass
class RefundResponse:
    """Refund response data structure"""
    success: bool
    refund_id: str
    amount: Decimal = Decimal('0')
    currency: str = ""
    status: str = ""
    error_message: Optional[str] = None
    error_code: Optional[str] = None


class PaymentGatewayService:
    """
    Enterprise-grade payment gateway service with Stripe integration
    Provides atomic transactions, comprehensive error handling, and audit trails
    """
    
    def __init__(self):
        self.stripe_provider = self._get_stripe_provider()
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def _get_stripe_provider(self) -> PaymentProvider:
        """Get or create Stripe payment provider"""
        try:
            provider = PaymentProvider.objects.get(provider_type=PaymentProvider.ProviderType.STRIPE)
        except PaymentProvider.DoesNotExist:
            provider = PaymentProvider.objects.create(
                name="Stripe",
                provider_type=PaymentProvider.ProviderType.STRIPE,
                is_active=True,
                currency_supported=['USD', 'EUR', 'GBP', 'INR'],
                min_amount=Decimal('0.50'),
                max_amount=Decimal('999999.99'),
                processing_fee_percent=Decimal('2.9'),
                processing_fee_fixed=Decimal('0.30'),
                description="Stripe Payment Gateway"
            )
        return provider
    
    @transaction.atomic
    def create_payment_intent(self, request: PaymentRequest) -> PaymentResponse:
        """
        Create payment intent with atomic transaction
        Ensures data consistency across all operations
        """
        try:
            # Validate request
            self._validate_payment_request(request)
            
            # Calculate processing fee
            processing_fee = self._calculate_processing_fee(request.amount)
            total_amount = request.amount + processing_fee
            
            # Create Stripe payment intent
            stripe_intent = self._create_stripe_intent(request, total_amount)
            
            # Create database record
            payment = self._create_payment_record(
                request, stripe_intent, processing_fee
            )
            
            # Log the transaction
            self._log_payment_activity(
                payment, "PAYMENT_INTENT_CREATED",
                f"Payment intent created: {stripe_intent['id']}"
            )
            
            # Prepare response
            response = PaymentResponse(
                success=True,
                payment_intent_id=stripe_intent['id'],
                client_secret=stripe_intent['client_secret'],
                status=stripe_intent['status'],
                amount=request.amount,
                currency=request.currency.upper(),
                requires_action=stripe_intent['status'] == PaymentIntentStatus.REQUIRES_ACTION.value,
                metadata=stripe_intent.get('metadata', {})
            )
            
            return response
            
        except stripe.error.StripeError as e:
            self.logger.error(f"Stripe error in create_payment_intent: {str(e)}")
            return PaymentResponse(
                success=False,
                payment_intent_id="",
                error_message=str(e),
                error_code=e.code if hasattr(e, 'code') else 'STRIPE_ERROR'
            )
        
        except Exception as e:
            self.logger.error(f"Unexpected error in create_payment_intent: {str(e)}")
            return PaymentResponse(
                success=False,
                payment_intent_id="",
                error_message="An unexpected error occurred",
                error_code='INTERNAL_ERROR'
            )
    
    def _create_stripe_intent(self, request: PaymentRequest, total_amount: Decimal) -> Dict:
        """Create Stripe payment intent"""
        intent_params = {
            'amount': int(total_amount * 100),  # Stripe uses cents
            'currency': request.currency.lower(),
            'metadata': {
                'customer_id': request.customer_id,
                'order_id': request.order_id or '',
                'invoice_id': request.invoice_id or '',
                'system': 'rental_management',
                'created_at': timezone.now().isoformat(),
                **(request.metadata or {})
            },
            'description': request.description or f"Payment for order {request.order_id}",
        }
        
        # Add automatic payment methods if enabled
        if request.automatic_payment_methods:
            intent_params['automatic_payment_methods'] = {'enabled': True}
        
        # Add payment method if provided
        if request.payment_method:
            intent_params['payment_method'] = request.payment_method
        
        # Add confirmation if required
        if request.confirm:
            intent_params['confirm'] = True
            if request.return_url:
                intent_params['return_url'] = request.return_url
        
        return stripe.PaymentIntent.create(**intent_params)
    
    def _create_payment_record(self, request: PaymentRequest, stripe_intent: Dict, processing_fee: Decimal) -> Payment:
        """Create payment record in database"""
        payment = Payment.objects.create(
            invoice_id=request.invoice_id,
            customer_id=request.customer_id,
            provider=self.stripe_provider,
            payment_method=Payment.PaymentMethod.CREDIT_CARD,
            gateway_payment_id=stripe_intent['id'],
            amount=request.amount,
            processing_fee=processing_fee,
            currency=request.currency.upper(),
            status=self._map_stripe_status_to_payment_status(stripe_intent['status']),
            description=request.description,
            gateway_response=stripe_intent
        )
        return payment
    
    @transaction.atomic
    def confirm_payment_intent(self, payment_intent_id: str, payment_method_id: Optional[str] = None) -> PaymentResponse:
        """
        Confirm payment intent with atomic transaction
        """
        try:
            # Retrieve payment from database
            payment = Payment.objects.select_for_update().get(
                gateway_payment_id=payment_intent_id
            )
            
            # Confirm with Stripe
            confirm_params = {}
            if payment_method_id:
                confirm_params['payment_method'] = payment_method_id
            
            stripe_intent = stripe.PaymentIntent.confirm(
                payment_intent_id,
                **confirm_params
            )
            
            # Update payment record
            payment.status = self._map_stripe_status_to_payment_status(stripe_intent['status'])
            payment.gateway_response = stripe_intent
            
            if stripe_intent['status'] == PaymentIntentStatus.SUCCEEDED.value:
                payment.processed_at = timezone.now()
                payment.completed_at = timezone.now()
                
                # Process successful payment
                self._process_successful_payment(payment)
            
            payment.save()
            
            # Log the transaction
            self._log_payment_activity(
                payment, "PAYMENT_CONFIRMED",
                f"Payment confirmed with status: {stripe_intent['status']}"
            )
            
            return PaymentResponse(
                success=True,
                payment_intent_id=stripe_intent['id'],
                status=stripe_intent['status'],
                amount=Decimal(str(stripe_intent['amount'])) / 100,
                currency=stripe_intent['currency'].upper(),
                requires_action=stripe_intent['status'] == PaymentIntentStatus.REQUIRES_ACTION.value
            )
            
        except Payment.DoesNotExist:
            self.logger.error(f"Payment not found for intent: {payment_intent_id}")
            return PaymentResponse(
                success=False,
                payment_intent_id=payment_intent_id,
                error_message="Payment not found",
                error_code='PAYMENT_NOT_FOUND'
            )
        
        except stripe.error.StripeError as e:
            self.logger.error(f"Stripe error in confirm_payment_intent: {str(e)}")
            return PaymentResponse(
                success=False,
                payment_intent_id=payment_intent_id,
                error_message=str(e),
                error_code=e.code if hasattr(e, 'code') else 'STRIPE_ERROR'
            )
    
    @transaction.atomic
    def process_refund(self, request: RefundRequest) -> RefundResponse:
        """
        Process refund with atomic transaction
        """
        try:
            # Get payment record
            payment = Payment.objects.select_for_update().get(
                gateway_payment_id=request.payment_intent_id
            )
            
            # Validate refund amount
            if request.amount:
                if request.amount > payment.refundable_amount:
                    raise ValidationError("Refund amount exceeds refundable amount")
                refund_amount = request.amount
            else:
                refund_amount = payment.refundable_amount
            
            # Create Stripe refund
            stripe_refund = stripe.Refund.create(
                payment_intent=request.payment_intent_id,
                amount=int(refund_amount * 100),  # Stripe uses cents
                metadata={
                    'payment_id': str(payment.id),
                    'reason': request.reason,
                    'processed_by': 'system',
                    **(request.metadata or {})
                },
                reason='requested_by_customer'
            )
            
            # Create refund record
            refund = PaymentRefund.objects.create(
                payment=payment,
                amount=refund_amount,
                currency=payment.currency,
                reason=request.reason,
                gateway_refund_id=stripe_refund['id'],
                status=PaymentRefund.Status.COMPLETED,
                processed_at=timezone.now(),
                completed_at=timezone.now(),
                gateway_response=stripe_refund
            )
            
            # Update payment
            payment.refunded_amount += refund_amount
            if payment.refunded_amount >= payment.amount:
                payment.status = Payment.Status.REFUNDED
            else:
                payment.status = Payment.Status.PARTIAL_REFUND
            payment.save()
            
            # Update related invoice
            if payment.invoice:
                payment.invoice.subtract_payment(refund_amount)
            
            # Log the transaction
            self._log_payment_activity(
                payment, "REFUND_PROCESSED",
                f"Refund processed: {stripe_refund['id']} for amount {refund_amount}"
            )
            
            # Send notification
            self._send_refund_notification(payment, refund)
            
            return RefundResponse(
                success=True,
                refund_id=stripe_refund['id'],
                amount=refund_amount,
                currency=payment.currency,
                status=stripe_refund['status']
            )
            
        except Payment.DoesNotExist:
            self.logger.error(f"Payment not found for intent: {request.payment_intent_id}")
            return RefundResponse(
                success=False,
                refund_id="",
                error_message="Payment not found",
                error_code='PAYMENT_NOT_FOUND'
            )
        
        except stripe.error.StripeError as e:
            self.logger.error(f"Stripe error in process_refund: {str(e)}")
            return RefundResponse(
                success=False,
                refund_id="",
                error_message=str(e),
                error_code=e.code if hasattr(e, 'code') else 'STRIPE_ERROR'
            )
    
    @transaction.atomic
    def handle_webhook(self, payload: str, signature: str) -> bool:
        """
        Handle Stripe webhooks with atomic transaction
        """
        try:
            # Verify webhook signature
            endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
            event = stripe.Webhook.construct_event(
                payload, signature, endpoint_secret
            )
            
            # Check for duplicate events
            webhook_event, created = WebhookEvent.objects.get_or_create(
                provider=self.stripe_provider,
                event_id=event['id'],
                defaults={
                    'event_type': event['type'],
                    'payload': event,
                    'signature_verified': True,
                    'status': WebhookEvent.Status.RECEIVED
                }
            )
            
            if not created:
                self.logger.info(f"Duplicate webhook event ignored: {event['id']}")
                return True
            
            # Process the event
            webhook_event.status = WebhookEvent.Status.PROCESSING
            webhook_event.save()
            
            success = self._process_webhook_event(webhook_event, event)
            
            if success:
                webhook_event.mark_processed("Event processed successfully")
            else:
                webhook_event.mark_failed("Failed to process event")
            
            return success
            
        except stripe.error.SignatureVerificationError as e:
            self.logger.error(f"Webhook signature verification failed: {str(e)}")
            return False
        
        except Exception as e:
            self.logger.error(f"Error processing webhook: {str(e)}")
            return False
    
    def _process_webhook_event(self, webhook_event: WebhookEvent, event: Dict) -> bool:
        """Process specific webhook events"""
        event_type = event['type']
        
        try:
            if event_type == 'payment_intent.succeeded':
                return self._handle_payment_succeeded(event)
            elif event_type == 'payment_intent.payment_failed':
                return self._handle_payment_failed(event)
            elif event_type == 'charge.dispute.created':
                return self._handle_dispute_created(event)
            elif event_type == 'invoice.payment_succeeded':
                return self._handle_invoice_payment_succeeded(event)
            else:
                self.logger.info(f"Unhandled webhook event: {event_type}")
                return True  # Mark as processed for unhandled events
                
        except Exception as e:
            self.logger.error(f"Error processing webhook event {event_type}: {str(e)}")
            return False
    
    def _handle_payment_succeeded(self, event: Dict) -> bool:
        """Handle successful payment webhook"""
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        
        try:
            payment = Payment.objects.get(gateway_payment_id=payment_intent_id)
            
            if payment.status != Payment.Status.COMPLETED:
                payment.status = Payment.Status.COMPLETED
                payment.processed_at = timezone.now()
                payment.completed_at = timezone.now()
                payment.save()
                
                # Process successful payment
                self._process_successful_payment(payment)
                
                self.logger.info(f"Payment marked as completed: {payment.payment_number}")
            
            return True
            
        except Payment.DoesNotExist:
            self.logger.error(f"Payment not found for webhook: {payment_intent_id}")
            return False
    
    def _handle_payment_failed(self, event: Dict) -> bool:
        """Handle failed payment webhook"""
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        
        try:
            payment = Payment.objects.get(gateway_payment_id=payment_intent_id)
            
            payment.status = Payment.Status.FAILED
            payment.failure_reason = payment_intent.get('last_payment_error', {}).get('message', 'Payment failed')
            payment.save()
            
            # Send failure notification
            self._send_payment_failure_notification(payment)
            
            self.logger.info(f"Payment marked as failed: {payment.payment_number}")
            return True
            
        except Payment.DoesNotExist:
            self.logger.error(f"Payment not found for webhook: {payment_intent_id}")
            return False
    
    def _process_successful_payment(self, payment: Payment):
        """Process successful payment - update related records"""
        try:
            # Update invoice
            if payment.invoice:
                payment.invoice.add_payment(payment.amount)
                self.logger.info(f"Invoice updated for payment: {payment.payment_number}")
            
            # Update order if applicable
            if hasattr(payment, 'order') and payment.order:
                payment.order.payment_status = 'PAID'
                payment.order.save()
                self.logger.info(f"Order payment status updated: {payment.order.order_number}")
            
            # Send success notification
            self._send_payment_success_notification(payment)
            
        except Exception as e:
            self.logger.error(f"Error processing successful payment {payment.payment_number}: {str(e)}")
    
    def _validate_payment_request(self, request: PaymentRequest):
        """Validate payment request"""
        if request.amount <= 0:
            raise ValidationError("Amount must be greater than 0")
        
        if request.amount < self.stripe_provider.min_amount:
            raise ValidationError(f"Amount must be at least {self.stripe_provider.min_amount}")
        
        if request.amount > self.stripe_provider.max_amount:
            raise ValidationError(f"Amount cannot exceed {self.stripe_provider.max_amount}")
        
        if request.currency.upper() not in self.stripe_provider.currency_supported:
            raise ValidationError(f"Currency {request.currency} not supported")
    
    def _calculate_processing_fee(self, amount: Decimal) -> Decimal:
        """Calculate processing fee"""
        return self.stripe_provider.calculate_processing_fee(amount)
    
    def _map_stripe_status_to_payment_status(self, stripe_status: str) -> str:
        """Map Stripe status to internal payment status"""
        status_mapping = {
            PaymentIntentStatus.REQUIRES_PAYMENT_METHOD.value: Payment.Status.PENDING,
            PaymentIntentStatus.REQUIRES_CONFIRMATION.value: Payment.Status.PENDING,
            PaymentIntentStatus.REQUIRES_ACTION.value: Payment.Status.PROCESSING,
            PaymentIntentStatus.PROCESSING.value: Payment.Status.PROCESSING,
            PaymentIntentStatus.REQUIRES_CAPTURE.value: Payment.Status.PROCESSING,
            PaymentIntentStatus.SUCCEEDED.value: Payment.Status.COMPLETED,
            PaymentIntentStatus.CANCELED.value: Payment.Status.CANCELLED,
        }
        return status_mapping.get(stripe_status, Payment.Status.PENDING)
    
    def _log_payment_activity(self, payment: Payment, activity_type: str, message: str):
        """Log payment activity for audit trail"""
        self.logger.info(f"Payment {payment.payment_number} - {activity_type}: {message}")
        
        # Store in cache for recent activity tracking
        cache_key = f"payment_activity:{payment.id}"
        activities = cache.get(cache_key, [])
        activities.append({
            'timestamp': timezone.now().isoformat(),
            'type': activity_type,
            'message': message
        })
        cache.set(cache_key, activities[-10:], 3600)  # Keep last 10 activities for 1 hour
    
    def _send_payment_success_notification(self, payment: Payment):
        """Send payment success notification"""
        try:
            if hasattr(payment.customer, 'email'):
                email_service.send_payment_confirmation(
                    to_email=payment.customer.email,
                    payment=payment
                )
        except Exception as e:
            self.logger.error(f"Failed to send payment success notification: {str(e)}")
    
    def _send_payment_failure_notification(self, payment: Payment):
        """Send payment failure notification"""
        try:
            if hasattr(payment.customer, 'email'):
                email_service.send_payment_failure_notification(
                    to_email=payment.customer.email,
                    payment=payment
                )
        except Exception as e:
            self.logger.error(f"Failed to send payment failure notification: {str(e)}")
    
    def _send_refund_notification(self, payment: Payment, refund: PaymentRefund):
        """Send refund notification"""
        try:
            if hasattr(payment.customer, 'email'):
                email_service.send_refund_notification(
                    to_email=payment.customer.email,
                    payment=payment,
                    refund=refund
                )
        except Exception as e:
            self.logger.error(f"Failed to send refund notification: {str(e)}")
    
    def get_payment_status(self, payment_intent_id: str) -> PaymentResponse:
        """Get current payment status"""
        try:
            # First check our database
            payment = Payment.objects.get(gateway_payment_id=payment_intent_id)
            
            # Optionally sync with Stripe for latest status
            stripe_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return PaymentResponse(
                success=True,
                payment_intent_id=stripe_intent['id'],
                status=stripe_intent['status'],
                amount=payment.amount,
                currency=payment.currency,
                requires_action=stripe_intent['status'] == PaymentIntentStatus.REQUIRES_ACTION.value
            )
            
        except Payment.DoesNotExist:
            return PaymentResponse(
                success=False,
                payment_intent_id=payment_intent_id,
                error_message="Payment not found",
                error_code='PAYMENT_NOT_FOUND'
            )
        
        except stripe.error.StripeError as e:
            return PaymentResponse(
                success=False,
                payment_intent_id=payment_intent_id,
                error_message=str(e),
                error_code=e.code if hasattr(e, 'code') else 'STRIPE_ERROR'
            )


# Global service instance
payment_service = PaymentGatewayService()

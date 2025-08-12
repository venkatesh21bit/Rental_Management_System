"""
Payment services for handling payment processing logic
"""
from typing import Dict, Any, Optional
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from dataclasses import dataclass
import stripe
import logging

logger = logging.getLogger(__name__)


@dataclass
class PaymentRequest:
    """Data class for payment requests"""
    amount: Decimal
    currency: str = 'usd'
    description: str = ''
    customer_email: str = ''
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class RefundRequest:
    """Data class for refund requests"""
    payment_intent_id: str
    amount: Optional[Decimal] = None
    reason: str = ''
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class PaymentService:
    """Service for handling payment operations"""
    
    def __init__(self):
        # Initialize Stripe if API key is available
        stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', None)
        if stripe_key:
            stripe.api_key = stripe_key
    
    def create_payment_intent(self, payment_request: PaymentRequest) -> Dict[str, Any]:
        """Create a payment intent with the payment processor"""
        try:
            # Convert amount to cents for Stripe
            amount_in_cents = int(payment_request.amount * 100)
            
            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency=payment_request.currency,
                description=payment_request.description,
                receipt_email=payment_request.customer_email,
                metadata=payment_request.metadata,
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            
            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount': payment_request.amount,
                'currency': payment_request.currency
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            raise Exception(f"Payment processing error: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            raise Exception(f"Payment service error: {str(e)}")
    
    def confirm_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a payment and return payment details"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount': Decimal(intent.amount) / 100,  # Convert from cents
                'currency': intent.currency,
                'payment_method': intent.payment_method,
                'receipt_email': intent.receipt_email,
                'created': timezone.datetime.fromtimestamp(intent.created, tz=timezone.utc)
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment: {e}")
            raise Exception(f"Payment confirmation error: {str(e)}")
        except Exception as e:
            logger.error(f"Error confirming payment: {e}")
            raise Exception(f"Payment service error: {str(e)}")
    
    def create_refund(self, refund_request: RefundRequest) -> Dict[str, Any]:
        """Create a refund for a payment"""
        try:
            refund_data = {
                'payment_intent': refund_request.payment_intent_id,
                'reason': refund_request.reason or 'requested_by_customer',
                'metadata': refund_request.metadata
            }
            
            if refund_request.amount:
                # Partial refund - convert to cents
                refund_data['amount'] = int(refund_request.amount * 100)
            
            refund = stripe.Refund.create(**refund_data)
            
            return {
                'refund_id': refund.id,
                'payment_intent_id': refund.payment_intent,
                'status': refund.status,
                'amount': Decimal(refund.amount) / 100,  # Convert from cents
                'currency': refund.currency,
                'reason': refund.reason,
                'created': timezone.datetime.fromtimestamp(refund.created, tz=timezone.utc)
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {e}")
            raise Exception(f"Refund processing error: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating refund: {e}")
            raise Exception(f"Refund service error: {str(e)}")
    
    def get_payment_methods(self, customer_id: str = None) -> Dict[str, Any]:
        """Get available payment methods"""
        try:
            # This is a basic implementation
            # In a real application, you might retrieve customer-specific payment methods
            return {
                'payment_methods': [
                    {'type': 'card', 'name': 'Credit/Debit Card'},
                    {'type': 'bank_transfer', 'name': 'Bank Transfer'},
                ]
            }
        except Exception as e:
            logger.error(f"Error getting payment methods: {e}")
            return {'payment_methods': []}
    
    def webhook_handler(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle webhook events from payment processor"""
        try:
            event_type = event_data.get('type', '')
            
            if event_type == 'payment_intent.succeeded':
                return self._handle_payment_success(event_data)
            elif event_type == 'payment_intent.payment_failed':
                return self._handle_payment_failure(event_data)
            elif event_type == 'charge.dispute.created':
                return self._handle_dispute_created(event_data)
            else:
                logger.info(f"Unhandled webhook event type: {event_type}")
                return {'status': 'ignored', 'message': f'Event type {event_type} not handled'}
                
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def _handle_payment_success(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful payment webhook"""
        # Implementation for handling successful payments
        payment_intent = event_data.get('data', {}).get('object', {})
        return {
            'status': 'processed',
            'payment_intent_id': payment_intent.get('id'),
            'action': 'payment_succeeded'
        }
    
    def _handle_payment_failure(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle failed payment webhook"""
        # Implementation for handling failed payments
        payment_intent = event_data.get('data', {}).get('object', {})
        return {
            'status': 'processed',
            'payment_intent_id': payment_intent.get('id'),
            'action': 'payment_failed'
        }
    
    def _handle_dispute_created(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle dispute created webhook"""
        # Implementation for handling disputes
        charge = event_data.get('data', {}).get('object', {})
        return {
            'status': 'processed',
            'charge_id': charge.get('id'),
            'action': 'dispute_created'
        }


# Create a singleton instance
payment_service = PaymentService()

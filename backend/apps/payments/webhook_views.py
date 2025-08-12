"""
Webhook views for handling payment provider webhooks
"""
import json
import logging
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import WebhookEvent, Payment
from .services import payment_service

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    """
    Handle Stripe webhook events
    """
    
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            # In production, you should verify the webhook signature
            # For now, we'll just parse the JSON payload
            event_data = json.loads(payload.decode('utf-8'))
            
            # Create webhook event record
            with transaction.atomic():
                webhook_event = WebhookEvent.objects.create(
                    provider='stripe',
                    event_type=event_data.get('type', ''),
                    event_id=event_data.get('id', ''),
                    payload=event_data,
                    status='processing'
                )
                
                # Process the webhook using our payment service
                result = payment_service.webhook_handler(event_data)
                
                # Update webhook event status
                webhook_event.status = 'processed' if result.get('status') == 'processed' else 'failed'
                webhook_event.response_data = result
                webhook_event.save()
                
                logger.info(f"Processed Stripe webhook: {event_data.get('type')} - {webhook_event.id}")
                
                return JsonResponse({'received': True})
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON payload in Stripe webhook")
            return HttpResponse("Invalid JSON", status=400)
        except Exception as e:
            logger.error(f"Error processing Stripe webhook: {e}")
            return HttpResponse("Webhook processing failed", status=500)


@csrf_exempt
@require_POST
def razorpay_webhook(request):
    """
    Handle Razorpay webhook events
    """
    try:
        # Parse the payload
        payload = json.loads(request.body.decode('utf-8'))
        
        # Create webhook event record
        with transaction.atomic():
            webhook_event = WebhookEvent.objects.create(
                provider='razorpay',
                event_type=payload.get('event', ''),
                event_id=payload.get('payment', {}).get('entity', {}).get('id', ''),
                payload=payload,
                status='processing'
            )
            
            # Process the webhook
            event_type = payload.get('event', '')
            
            if event_type == 'payment.captured':
                # Handle successful payment
                payment_data = payload.get('payment', {}).get('entity', {})
                webhook_event.response_data = {
                    'status': 'processed',
                    'action': 'payment_captured',
                    'payment_id': payment_data.get('id')
                }
            elif event_type == 'payment.failed':
                # Handle failed payment
                payment_data = payload.get('payment', {}).get('entity', {})
                webhook_event.response_data = {
                    'status': 'processed',
                    'action': 'payment_failed',
                    'payment_id': payment_data.get('id')
                }
            else:
                webhook_event.response_data = {
                    'status': 'ignored',
                    'message': f'Event type {event_type} not handled'
                }
            
            webhook_event.status = 'processed'
            webhook_event.save()
            
            logger.info(f"Processed Razorpay webhook: {event_type} - {webhook_event.id}")
            
            return JsonResponse({'received': True})
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON payload in Razorpay webhook")
        return HttpResponse("Invalid JSON", status=400)
    except Exception as e:
        logger.error(f"Error processing Razorpay webhook: {e}")
        return HttpResponse("Webhook processing failed", status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def webhook_health_check(request):
    """
    Health check endpoint for webhook monitoring
    """
    try:
        # Basic health check - verify database connectivity
        webhook_count = WebhookEvent.objects.count()
        
        return Response({
            'status': 'healthy',
            'service': 'payment-webhooks',
            'total_webhooks_processed': webhook_count,
            'timestamp': request._request.META.get('HTTP_DATE', 'unknown')
        })
    except Exception as e:
        logger.error(f"Webhook health check failed: {e}")
        return Response({
            'status': 'unhealthy',
            'service': 'payment-webhooks',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

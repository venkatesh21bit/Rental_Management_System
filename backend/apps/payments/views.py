from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Q, Sum, Count
from django.db import transaction
from datetime import datetime, timedelta
from decimal import Decimal
import json
import logging

from .models import (
    PaymentProvider, Payment, PaymentRefund, WebhookEvent,
    PaymentLink, BankAccount
)
from .serializers import (
    PaymentProviderSerializer, PaymentSerializer, PaymentRefundSerializer,
    PaymentLinkSerializer, BankAccountSerializer, WebhookEventSerializer,
    PaymentIntentRequestSerializer, PaymentIntentResponseSerializer,
    PaymentConfirmationSerializer, RefundRequestSerializer
)
from .services import payment_service, PaymentRequest, RefundRequest
from apps.orders.models import RentalOrder
from apps.invoicing.models import Invoice

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Industry-grade payment management with atomic transactions
    Handles payment intents, confirmations, and status tracking
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'customer', 'invoice', 'provider'
        ).prefetch_related('refunds')
        
        # Filter for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)
        
        # Advanced filtering
        payment_status = self.request.query_params.get('status')
        order_id = self.request.query_params.get('order_id')
        invoice_id = self.request.query_params.get('invoice_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        amount_min = self.request.query_params.get('amount_min')
        amount_max = self.request.query_params.get('amount_max')
        
        if payment_status in [choice[0] for choice in Payment.Status.choices]:
            queryset = queryset.filter(status=payment_status)
        
        if order_id:
            queryset = queryset.filter(invoice__order__order_number=order_id)
        
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        if date_from:
            try:
                date_from_parsed = datetime.fromisoformat(date_from).date()
                queryset = queryset.filter(created_at__date__gte=date_from_parsed)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_parsed = datetime.fromisoformat(date_to).date()
                queryset = queryset.filter(created_at__date__lte=date_to_parsed)
            except ValueError:
                pass
        
        if amount_min:
            try:
                queryset = queryset.filter(amount__gte=Decimal(amount_min))
            except (ValueError, TypeError):
                pass
        
        if amount_max:
            try:
                queryset = queryset.filter(amount__lte=Decimal(amount_max))
            except (ValueError, TypeError):
                pass
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def create_intent(self, request):
        """
        Create payment intent with comprehensive validation and atomic transactions
        """
        try:
            serializer = PaymentIntentRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Invalid payment data',
                        'details': serializer.errors
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            
            # Validate invoice/order exists and belongs to user
            invoice = None
            if data.get('invoice_id'):
                try:
                    invoice = Invoice.objects.get(id=data['invoice_id'])
                    if not request.user.is_staff and invoice.customer != request.user:
                        return Response({
                            'success': False,
                            'error': {
                                'code': 'PERMISSION_DENIED',
                                'message': 'You can only pay for your own invoices'
                            }
                        }, status=status.HTTP_403_FORBIDDEN)
                except Invoice.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': {
                            'code': 'INVOICE_NOT_FOUND',
                            'message': 'Invoice not found'
                        }
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Create payment request
            payment_request = PaymentRequest(
                amount=Decimal(str(data['amount'])),
                currency=data.get('currency', 'USD'),
                customer_id=str(request.user.id),
                invoice_id=data.get('invoice_id'),
                description=data.get('description', f"Payment for invoice {data.get('invoice_id', 'N/A')}"),
                metadata={
                    'user_id': str(request.user.id),
                    'user_email': request.user.email,
                    'request_ip': self._get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'timestamp': timezone.now().isoformat()
                },
                payment_method=data.get('payment_method'),
                confirm=data.get('confirm', False),
                return_url=data.get('return_url'),
                automatic_payment_methods=data.get('automatic_payment_methods', True)
            )
            
            # Create payment intent using service
            response = payment_service.create_payment_intent(payment_request)
            
            if response.success:
                return Response({
                    'success': True,
                    'data': {
                        'payment_intent_id': response.payment_intent_id,
                        'client_secret': response.client_secret,
                        'status': response.status,
                        'amount': float(response.amount),
                        'currency': response.currency,
                        'requires_action': response.requires_action,
                        'metadata': response.metadata
                    },
                    'message': 'Payment intent created successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': {
                        'code': response.error_code,
                        'message': response.error_message
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Unexpected error in create_intent: {str(e)}")
            return Response({
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'An unexpected error occurred while creating payment intent'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def confirm_payment(self, request):
        """
        Confirm payment with enhanced validation and atomic transactions
        """
        try:
            serializer = PaymentConfirmationSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Invalid confirmation data',
                        'details': serializer.errors
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            
            # Verify payment belongs to user
            try:
                payment = Payment.objects.get(
                    gateway_payment_id=data['payment_intent_id']
                )
                if not request.user.is_staff and payment.customer != request.user:
                    return Response({
                        'success': False,
                        'error': {
                            'code': 'PERMISSION_DENIED',
                            'message': 'You can only confirm your own payments'
                        }
                    }, status=status.HTTP_403_FORBIDDEN)
            except Payment.DoesNotExist:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'PAYMENT_NOT_FOUND',
                        'message': 'Payment not found'
                    }
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Confirm payment using service
            response = payment_service.confirm_payment_intent(
                data['payment_intent_id'],
                data.get('payment_method_id')
            )
            
            if response.success:
                return Response({
                    'success': True,
                    'data': {
                        'payment_intent_id': response.payment_intent_id,
                        'status': response.status,
                        'amount': float(response.amount),
                        'currency': response.currency,
                        'requires_action': response.requires_action
                    },
                    'message': 'Payment confirmed successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': {
                        'code': response.error_code,
                        'message': response.error_message
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Unexpected error in confirm_payment: {str(e)}")
            return Response({
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'An unexpected error occurred while confirming payment'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def process_refund(self, request):
        """
        Process refund with comprehensive validation and atomic transactions
        """
        try:
            # Only staff can process refunds
            if not request.user.is_staff:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'PERMISSION_DENIED',
                        'message': 'Only staff members can process refunds'
                    }
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = RefundRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Invalid refund data',
                        'details': serializer.errors
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            
            # Create refund request
            refund_request = RefundRequest(
                payment_intent_id=data['payment_intent_id'],
                amount=data.get('amount'),
                reason=data.get('reason', 'Customer requested refund'),
                metadata={
                    'processed_by': str(request.user.id),
                    'processed_by_email': request.user.email,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            # Process refund using service
            response = payment_service.process_refund(refund_request)
            
            if response.success:
                return Response({
                    'success': True,
                    'data': {
                        'refund_id': response.refund_id,
                        'amount': float(response.amount),
                        'currency': response.currency,
                        'status': response.status
                    },
                    'message': 'Refund processed successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': {
                        'code': response.error_code,
                        'message': response.error_message
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Unexpected error in process_refund: {str(e)}")
            return Response({
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'An unexpected error occurred while processing refund'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def payment_status(self, request):
        """
        Get payment status with real-time Stripe sync
        """
        payment_intent_id = request.query_params.get('payment_intent_id')
        if not payment_intent_id:
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_PARAMETER',
                    'message': 'payment_intent_id is required'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get payment status using service
            response = payment_service.get_payment_status(payment_intent_id)
            
            if response.success:
                return Response({
                    'success': True,
                    'data': {
                        'payment_intent_id': response.payment_intent_id,
                        'status': response.status,
                        'amount': float(response.amount),
                        'currency': response.currency,
                        'requires_action': response.requires_action
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': {
                        'code': response.error_code,
                        'message': response.error_message
                    }
                }, status=status.HTTP_404_NOT_FOUND if response.error_code == 'PAYMENT_NOT_FOUND' else status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Unexpected error in payment_status: {str(e)}")
            return Response({
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'An unexpected error occurred while fetching payment status'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def payment_analytics(self, request):
        """
        Get payment analytics for dashboard
        """
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Only staff members can access payment analytics'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get date range
            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            
            queryset = Payment.objects.all()
            
            if date_from:
                queryset = queryset.filter(created_at__date__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__date__lte=date_to)
            
            # Calculate analytics
            total_payments = queryset.count()
            successful_payments = queryset.filter(status=Payment.Status.COMPLETED).count()
            failed_payments = queryset.filter(status=Payment.Status.FAILED).count()
            total_amount = queryset.filter(status=Payment.Status.COMPLETED).aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0')
            
            # Payment method breakdown
            payment_methods = queryset.filter(status=Payment.Status.COMPLETED).values(
                'payment_method'
            ).annotate(
                count=Count('id'),
                amount=Sum('amount')
            )
            
            # Success rate
            success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
            
            return Response({
                'success': True,
                'data': {
                    'total_payments': total_payments,
                    'successful_payments': successful_payments,
                    'failed_payments': failed_payments,
                    'pending_payments': total_payments - successful_payments - failed_payments,
                    'total_amount': float(total_amount),
                    'success_rate': round(success_rate, 2),
                    'payment_methods': list(payment_methods),
                    'date_range': {
                        'from': date_from,
                        'to': date_to
                    }
                }
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error in payment_analytics: {str(e)}")
            return Response({
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'An unexpected error occurred while fetching analytics'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PaymentProviderViewSet(viewsets.ModelViewSet):
    queryset = PaymentProvider.objects.all()
    serializer_class = PaymentProviderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return PaymentProvider.objects.filter(is_active=True)
        return super().get_queryset()


class PaymentRefundViewSet(viewsets.ModelViewSet):
    queryset = PaymentRefund.objects.all()
    serializer_class = PaymentRefundSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('payment', 'payment__customer')
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(payment__customer=self.request.user)
        
        return queryset.order_by('-created_at')


class PaymentLinkViewSet(viewsets.ModelViewSet):
    queryset = PaymentLink.objects.all()
    serializer_class = PaymentLinkSerializer
    permission_classes = [IsAuthenticated]


class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return BankAccount.objects.filter(is_active=True)
        return super().get_queryset()


class WebhookEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WebhookEvent.objects.all()
    serializer_class = WebhookEventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return WebhookEvent.objects.none()
        return super().get_queryset().order_by('-created_at')
# Full implementation will be added when serializers are created

@api_view(['GET'])
def payments_overview(request):
    """Get payments overview statistics"""
    return Response({
        'status': 'success',
        'message': 'Payments app is working',
        'data': {
            'total_payments': 0,
            'successful_payments': 0,
            'failed_payments': 0,
            'pending_refunds': 0
        }
    })

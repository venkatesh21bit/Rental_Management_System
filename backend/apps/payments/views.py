from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Sum, Count
from datetime import datetime, timedelta

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


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('customer', 'order', 'provider')
        
        # Filter for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)
        
        # Filtering
        payment_status = self.request.query_params.get('status')
        order_id = self.request.query_params.get('order_id')
        
        if payment_status in [choice[0] for choice in Payment.Status.choices]:
            queryset = queryset.filter(status=payment_status)
        
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def create_intent(self, request):
        """Create payment intent for Stripe/Razorpay"""
        serializer = PaymentIntentRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # This would integrate with actual payment gateways
        # For demo purposes, return mock response
        
        return Response({
            'success': True,
            'data': {
                'client_secret': 'pi_mock_client_secret',
                'payment_intent_id': 'pi_mock_payment_intent',
                'amount': data['amount'],
                'currency': data['currency']
            }
        })
    
    @action(detail=False, methods=['post'])
    def confirm(self, request):
        """Confirm payment completion"""
        serializer = PaymentConfirmationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        try:
            # Create payment record
            payment = Payment.objects.create(
                order_id=data['order_id'],
                customer=request.user,
                amount=data.get('amount', 0),
                status=Payment.Status.COMPLETED,
                payment_method='ONLINE',
                transaction_id=data['transaction_id'],
                paid_at=timezone.now()
            )
            
            return Response({
                'success': True,
                'message': 'Payment confirmed successfully',
                'data': {
                    'payment_id': str(payment.id),
                    'payment_number': payment.payment_number
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'PAYMENT_CONFIRMATION_FAILED',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import (
    PaymentProvider, Payment, PaymentRefund, WebhookEvent,
    PaymentLink, BankAccount
)

User = get_user_model()


class PaymentProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProvider
        fields = [
            'id', 'name', 'provider_type', 'api_key_public', 'webhook_url',
            'supported_currencies', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'api_key_secret': {'write_only': True}
        }


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'order', 'order_number', 'customer',
            'customer_name', 'provider', 'provider_name', 'payment_type',
            'amount', 'currency', 'status', 'payment_method', 'transaction_id',
            'gateway_response', 'failure_reason', 'paid_at', 'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 'payment_number', 'gateway_response', 'paid_at',
            'created_at', 'updated_at'
        ]


class PaymentRefundSerializer(serializers.ModelSerializer):
    payment_number = serializers.CharField(source='payment.payment_number', read_only=True)
    
    class Meta:
        model = PaymentRefund
        fields = [
            'id', 'refund_number', 'payment', 'payment_number', 'amount',
            'reason', 'status', 'gateway_refund_id', 'refunded_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'refund_number', 'gateway_refund_id', 'refunded_at',
            'created_at', 'updated_at'
        ]


class PaymentLinkSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = PaymentLink
        fields = [
            'id', 'order', 'order_number', 'link_id', 'amount', 'currency',
            'description', 'expires_at', 'is_used', 'payment_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'link_id', 'payment_url', 'is_used', 'created_at', 'updated_at'
        ]


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_name', 'account_number', 'bank_name', 'routing_number',
            'swift_code', 'account_type', 'currency', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WebhookEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEvent
        fields = [
            'id', 'provider', 'event_type', 'event_data', 'processed',
            'processing_attempts', 'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# Request/Response Serializers
class PaymentIntentRequestSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(default='INR')
    payment_method = serializers.ChoiceField(choices=['stripe', 'razorpay', 'paypal'])
    description = serializers.CharField(required=False, allow_blank=True)


class PaymentIntentResponseSerializer(serializers.Serializer):
    client_secret = serializers.CharField()
    payment_intent_id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()


class PaymentConfirmationSerializer(serializers.Serializer):
    payment_intent_id = serializers.CharField()
    transaction_id = serializers.CharField()
    order_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)


class RefundRequestSerializer(serializers.Serializer):
    payment_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    reason = serializers.CharField()
    notify_customer = serializers.BooleanField(default=True)

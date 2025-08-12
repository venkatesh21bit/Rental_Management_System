from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet, PaymentProviderViewSet, PaymentRefundViewSet,
    PaymentLinkViewSet, BankAccountViewSet, WebhookEventViewSet
)
from .webhook_views import StripeWebhookView, razorpay_webhook, webhook_health_check
from .order_payment_views import (
    create_order_payment, complete_payment, payment_providers, order_payment_status
)

app_name = 'payments'

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'providers', PaymentProviderViewSet, basename='payment-provider')
router.register(r'refunds', PaymentRefundViewSet, basename='payment-refund')
router.register(r'payment-links', PaymentLinkViewSet, basename='payment-link')
router.register(r'bank-accounts', BankAccountViewSet, basename='bank-account')
router.register(r'webhooks', WebhookEventViewSet, basename='webhook-event')

# Order payment endpoints
order_payment_patterns = [
    path('order-payment/create/', create_order_payment, name='create-order-payment'),
    path('order-payment/complete/', complete_payment, name='complete-payment'),
    path('order-payment/providers/', payment_providers, name='order-payment-providers'),
    path('order-payment/status/', order_payment_status, name='order-payment-status'),
    # Legacy patterns for backward compatibility
    path('orders/<uuid:order_id>/create-payment/', create_order_payment, name='create-order-payment-legacy'),
    path('payments/<uuid:payment_id>/complete/', complete_payment, name='complete-payment-legacy'),
    path('providers/available/', payment_providers, name='available-providers-legacy'),
    path('orders/<uuid:order_id>/payment-status/', order_payment_status, name='order-payment-status-legacy'),
]

# Industry-grade webhook endpoints with atomic transactions
webhook_patterns = [
    path('webhooks/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('webhooks/razorpay/', razorpay_webhook, name='razorpay-webhook'),
    path('webhooks/health/', webhook_health_check, name='webhook-health'),
]

# Legacy webhook endpoint (maintained for backwards compatibility)
additional_patterns = [
    path('webhook/', WebhookEventViewSet.as_view({'post': 'create'}), name='webhook'),
]

urlpatterns = [
    path('', include(router.urls)),
] + order_payment_patterns + webhook_patterns + additional_patterns

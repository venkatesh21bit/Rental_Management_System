from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet, PaymentProviderViewSet, PaymentRefundViewSet,
    PaymentLinkViewSet, BankAccountViewSet, WebhookEventViewSet
)
from .webhook_views import StripeWebhookView, razorpay_webhook, webhook_health_check

app_name = 'payments'

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'providers', PaymentProviderViewSet, basename='payment-provider')
router.register(r'refunds', PaymentRefundViewSet, basename='payment-refund')
router.register(r'payment-links', PaymentLinkViewSet, basename='payment-link')
router.register(r'bank-accounts', BankAccountViewSet, basename='bank-account')
router.register(r'webhooks', WebhookEventViewSet, basename='webhook-event')

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
] + webhook_patterns + additional_patterns

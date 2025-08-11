from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    APIKeyViewSet, IntegrationViewSet, WebhookEndpointViewSet,
    APILogViewSet, RateLimitRuleViewSet, ExternalSystemViewSet
)

app_name = 'api'

router = DefaultRouter()
router.register(r'keys', APIKeyViewSet, basename='api-key')
router.register(r'integrations', IntegrationViewSet, basename='integration')
router.register(r'webhooks', WebhookEndpointViewSet, basename='webhook-endpoint')
router.register(r'logs', APILogViewSet, basename='api-log')
router.register(r'rate-limits', RateLimitRuleViewSet, basename='rate-limit-rule')
router.register(r'systems', ExternalSystemViewSet, basename='external-system')

urlpatterns = [
    path('', include(router.urls)),
]

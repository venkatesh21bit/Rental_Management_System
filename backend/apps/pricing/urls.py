from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pricelists', views.PriceListViewSet, basename='pricelist')
router.register(r'pricing-rules', views.PricingRuleViewSet, basename='pricingrule')
router.register(r'late-fees', views.LateFeeViewSet, basename='latefee')
router.register(r'pricing', views.PricingViewSet, basename='pricing')

# Additional specific endpoints
additional_patterns = [
    path('pricelist/price/', views.PricingViewSet.as_view({'get': 'calculate', 'post': 'calculate'}), name='price-calculator'),
]

urlpatterns = [
    path('', include(router.urls)),
] + additional_patterns

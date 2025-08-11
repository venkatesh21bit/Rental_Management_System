from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'pricelists', views.PriceListViewSet, basename='pricelist')
router.register(r'pricing-rules', views.PricingRuleViewSet, basename='pricingrule')
router.register(r'seasonal-pricing', views.SeasonalPricingViewSet, basename='seasonalpricing')
router.register(r'volume-discounts', views.VolumeDiscountViewSet, basename='volumediscount')
router.register(r'loyalty-discounts', views.LoyaltyDiscountViewSet, basename='loyaltydiscount')
router.register(r'late-fees', views.LateFeeViewSet, basename='latefee')
router.register(r'pricing', views.PricingViewSet, basename='pricing')

urlpatterns = [
    path('', include(router.urls)),
]

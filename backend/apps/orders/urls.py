from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RentalQuoteViewSet, RentalOrderViewSet, ReservationViewSet,
    AvailabilityViewSet, RentalContractViewSet
)

router = DefaultRouter()
router.register(r'quotes', RentalQuoteViewSet)
router.register(r'orders', RentalOrderViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'contracts', RentalContractViewSet)
router.register(r'availability', AvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'delivery_docs', views.DeliveryDocumentViewSet, basename='deliverydocument')
router.register(r'return_docs', views.ReturnDocumentViewSet, basename='returndocument')
router.register(r'stock-movements', views.StockMovementViewSet, basename='stockmovement')
router.register(r'routes', views.DeliveryRouteViewSet, basename='deliveryroute')

app_name = 'deliveries'

urlpatterns = [
    path('', include(router.urls)),
]

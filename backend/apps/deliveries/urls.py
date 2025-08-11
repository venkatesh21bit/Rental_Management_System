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
    
    # Automated workflow endpoints
    path('overview/', views.delivery_overview, name='delivery_overview'),
    path('delivery/<uuid:delivery_id>/status/', views.update_delivery_status, name='update_delivery_status'),
    path('return/<uuid:return_id>/status/', views.update_return_status, name='update_return_status'),
    
    # Auto-scheduling and workflow endpoints are in the viewset actions:
    # POST /deliveries/routes/auto_schedule/ - Auto-schedule deliveries
    # POST /deliveries/routes/trigger_workflow/ - Trigger delivery workflow
    # GET /deliveries/routes/analytics/ - Get delivery analytics
]

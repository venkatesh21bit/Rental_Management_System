from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.ProductCategoryViewSet, basename='productcategory')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'product-images', views.ProductImageViewSet, basename='productimage')
router.register(r'product-items', views.ProductItemViewSet, basename='productitem')
router.register(r'inventory', views.InventoryViewSet, basename='inventory')

# Additional specific endpoints
additional_patterns = [
    path('product_stock/<int:product_id>/', views.InventoryViewSet.as_view({'get': 'list'}), name='product-stock'),
    path('inventory_items/', views.ProductItemViewSet.as_view({'get': 'list', 'post': 'create'}), name='inventory-items'),
]

urlpatterns = [
    path('', include(router.urls)),
] + additional_patterns

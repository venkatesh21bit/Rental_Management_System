from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Auth URLs (no router needed)
auth_urlpatterns = [
    path('auth/register/', views.register, name='auth-register'),
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/logout/', views.logout_view, name='auth-logout'),
    path('auth/refresh/', views.refresh_token, name='auth-refresh'),
    path('auth/forgot-password/', views.forgot_password, name='auth-forgot-password'),
    path('auth/reset-password/', views.reset_password, name='auth-reset-password'),
]

# Router for ViewSets
router = DefaultRouter()
router.register(r'profile', views.UserProfileViewSet, basename='userprofile')
router.register(r'customers', views.CustomerViewSet, basename='customer')
router.register(r'customer-groups', views.CustomerGroupViewSet, basename='customergroup')

urlpatterns = auth_urlpatterns + [
    path('', include(router.urls)),
]

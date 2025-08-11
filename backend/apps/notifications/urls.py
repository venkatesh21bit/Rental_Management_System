from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationTemplateViewSet, NotificationViewSet, NotificationSettingViewSet,
    ScheduledNotificationViewSet, NotificationLogViewSet, NotificationProviderViewSet
)

app_name = 'notifications'

router = DefaultRouter()
router.register(r'templates', NotificationTemplateViewSet, basename='notification-template')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'settings', NotificationSettingViewSet, basename='notification-setting')
router.register(r'scheduled', ScheduledNotificationViewSet, basename='scheduled-notification')
router.register(r'logs', NotificationLogViewSet, basename='notification-log')
router.register(r'providers', NotificationProviderViewSet, basename='notification-provider')

urlpatterns = [
    path('', include(router.urls)),
]

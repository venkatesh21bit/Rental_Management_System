from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationTemplateViewSet, NotificationViewSet, EmailNotificationViewSet,
    SMSNotificationViewSet, NotificationScheduleViewSet, NotificationPreferenceViewSet
)

app_name = 'notifications'

router = DefaultRouter()
router.register(r'templates', NotificationTemplateViewSet, basename='notification-template')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'emails', EmailNotificationViewSet, basename='email-notification')
router.register(r'sms', SMSNotificationViewSet, basename='sms-notification')
router.register(r'schedules', NotificationScheduleViewSet, basename='notification-schedule')
router.register(r'preferences', NotificationPreferenceViewSet, basename='notification-preference')

urlpatterns = [
    path('', include(router.urls)),
]

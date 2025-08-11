from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    NotificationTemplate,
    Notification,
    NotificationSetting,
    ScheduledNotification,
    NotificationLog,
    NotificationProvider
)

User = get_user_model()


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class NotificationSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class NotificationSettingSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = NotificationSetting
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class ScheduledNotificationSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = ScheduledNotification
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class NotificationLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = NotificationLog
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class NotificationProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationProvider
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


# Bulk operations serializers
class BulkNotificationSerializer(serializers.Serializer):
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of user IDs to send notifications to"
    )
    template_id = serializers.IntegerField(required=True)
    channel = serializers.ChoiceField(
        choices=['EMAIL', 'SMS', 'PUSH', 'WHATSAPP'],
        default='EMAIL'
    )
    context = serializers.JSONField(
        required=False,
        default=dict,
        help_text="Additional context for the notification template"
    )
    scheduled_for = serializers.DateTimeField(
        required=False,
        help_text="Schedule notification for later (optional)"
    )


class NotificationStatsSerializer(serializers.Serializer):
    total_sent = serializers.IntegerField()
    total_delivered = serializers.IntegerField()
    total_failed = serializers.IntegerField()
    delivery_rate = serializers.FloatField()
    channel_stats = serializers.DictField()
    recent_notifications = NotificationSerializer(many=True)


# Test notification serializer
class TestNotificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    template_name = serializers.CharField(required=True)
    context = serializers.JSONField(required=False, default=dict)

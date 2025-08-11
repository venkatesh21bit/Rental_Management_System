from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    APIKey, Integration, WebhookEndpoint, APILog,
    RateLimitRule, ExternalSystem
)

User = get_user_model()


class APIKeySerializer(serializers.ModelSerializer):
    key_preview = serializers.SerializerMethodField()
    last_used_display = serializers.DateTimeField(source='last_used', read_only=True)
    
    class Meta:
        model = APIKey
        fields = '__all__'
        read_only_fields = ('id', 'key', 'created_at', 'updated_at')
        extra_kwargs = {
            'key': {'write_only': True}
        }
    
    def get_key_preview(self, obj):
        if obj.key:
            return f"{obj.key[:8]}...{obj.key[-4:]}"
        return None


class IntegrationSerializer(serializers.ModelSerializer):
    system_name = serializers.CharField(source='system.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Integration
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate_integration_type(self, value):
        valid_types = ['WEBHOOK', 'API', 'FTP', 'EMAIL', 'DATABASE']
        if value not in valid_types:
            raise serializers.ValidationError("Invalid integration type")
        return value


class WebhookEndpointSerializer(serializers.ModelSerializer):
    integration_name = serializers.CharField(source='integration.name', read_only=True)
    event_count = serializers.SerializerMethodField()
    
    class Meta:
        model = WebhookEndpoint
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_event_count(self, obj):
        # Mock event count
        return 150
    
    def validate_http_method(self, value):
        if value not in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
            raise serializers.ValidationError("Invalid HTTP method")
        return value


class APILogSerializer(serializers.ModelSerializer):
    api_key_name = serializers.CharField(source='api_key.name', read_only=True)
    response_time_ms = serializers.SerializerMethodField()
    
    class Meta:
        model = APILog
        fields = '__all__'
        read_only_fields = ('id', 'created_at')
    
    def get_response_time_ms(self, obj):
        if obj.response_time:
            return round(obj.response_time * 1000, 2)
        return None


class RateLimitRuleSerializer(serializers.ModelSerializer):
    api_key_name = serializers.CharField(source='api_key.name', read_only=True)
    
    class Meta:
        model = RateLimitRule
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate_time_window(self, value):
        if value not in ['MINUTE', 'HOUR', 'DAY', 'MONTH']:
            raise serializers.ValidationError("Invalid time window")
        return value


class ExternalSystemSerializer(serializers.ModelSerializer):
    integration_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ExternalSystem
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_integration_count(self, obj):
        return obj.integration_set.count()


class APIKeyCreateSerializer(serializers.Serializer):
    """Serializer for creating new API keys"""
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    permissions = serializers.JSONField(required=False)
    expires_at = serializers.DateTimeField(required=False)
    rate_limit = serializers.IntegerField(required=False, min_value=1)


class APIStatsSerializer(serializers.Serializer):
    """Serializer for API statistics"""
    total_api_keys = serializers.IntegerField()
    active_integrations = serializers.IntegerField()
    webhook_endpoints = serializers.IntegerField()
    api_requests_today = serializers.IntegerField()
    api_requests_this_month = serializers.IntegerField()
    average_response_time = serializers.DecimalField(max_digits=10, decimal_places=2)
    error_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    top_endpoints = serializers.JSONField()


class WebhookTestSerializer(serializers.Serializer):
    """Serializer for testing webhook endpoints"""
    url = serializers.URLField()
    http_method = serializers.ChoiceField(choices=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    headers = serializers.JSONField(required=False)
    payload = serializers.JSONField(required=False)
    timeout = serializers.IntegerField(default=30, min_value=1, max_value=300)


class IntegrationTestSerializer(serializers.Serializer):
    """Serializer for testing integrations"""
    integration_id = serializers.IntegerField()
    test_payload = serializers.JSONField(required=False)
    
    def validate_integration_id(self, value):
        try:
            Integration.objects.get(id=value)
        except Integration.DoesNotExist:
            raise serializers.ValidationError("Integration not found")
        return value

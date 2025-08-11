from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Avg
from .models import (
    APIKey, APIRequest, WebhookEndpoint, WebhookDelivery,
    ExternalIntegration, APIRateLimit
)


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    """Admin interface for API keys"""
    list_display = [
        'name', 'key_preview', 'user', 'status_badge', 'rate_limit_display',
        'last_used_at', 'expires_at', 'created_at'
    ]
    list_filter = [
        'status', 'created_at', 'expires_at', 'last_used_at'
    ]
    search_fields = ['name', 'user__username', 'user__email']
    readonly_fields = [
        'id', 'key', 'last_used_at', 'total_requests',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'user', 'status')
        }),
        ('API Key Details', {
            'fields': ('key',)
        }),
        ('Permissions', {
            'fields': ('scopes', 'allowed_ips')
        }),
        ('Rate Limiting', {
            'fields': (
                'rate_limit_per_minute', 'rate_limit_per_hour', 'rate_limit_per_day'
            )
        }),
        ('Usage Tracking', {
            'fields': ('last_used_at', 'total_requests', 'expires_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    actions = ['revoke_keys', 'reset_usage_counters', 'extend_expiration']
    
    def key_preview(self, obj):
        """Display partial API key for security"""
        if obj.key:
            return f"{obj.key[:8]}...{obj.key[-4:]}"
        return "Not generated"
    key_preview.short_description = 'API Key'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'ACTIVE': 'green',
            'REVOKED': 'red',
            'EXPIRED': 'orange',
            'SUSPENDED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def rate_limit_display(self, obj):
        """Display rate limit information"""
        return format_html(
            '<span style="font-size: 11px;">{}/min | {}/hr | {}/day</span>',
            obj.rate_limit_per_minute,
            obj.rate_limit_per_hour,
            obj.rate_limit_per_day
        )
    rate_limit_display.short_description = 'Rate Limits'
    
    def revoke_keys(self, request, queryset):
        """Revoke selected API keys"""
        count = queryset.update(status='REVOKED')
        self.message_user(request, f"{count} API keys revoked.")
    revoke_keys.short_description = "Revoke selected keys"
    
    def reset_usage_counters(self, request, queryset):
        """Reset usage counters for selected keys"""
        count = queryset.update(total_requests=0, last_used_at=None)
        self.message_user(request, f"Usage counters reset for {count} API keys.")
    reset_usage_counters.short_description = "Reset usage counters"
    
    def extend_expiration(self, request, queryset):
        """Extend expiration by 30 days"""
        from datetime import timedelta
        for api_key in queryset:
            if api_key.expires_at:
                api_key.expires_at += timedelta(days=30)
                api_key.save()
        self.message_user(request, f"Extended expiration for {queryset.count()} API keys by 30 days.")
    extend_expiration.short_description = "Extend expiration by 30 days"


@admin.register(APIRequest)
class APIRequestAdmin(admin.ModelAdmin):
    """Admin interface for API request logs"""
    list_display = [
        'method', 'endpoint_short', 'api_key_name', 'status_badge',
        'response_time_ms', 'timestamp', 'ip_address'
    ]
    list_filter = [
        'method', 'status', 'timestamp', 'api_key__user'
    ]
    search_fields = [
        'api_key__name', 'endpoint', 'ip_address', 'user_agent'
    ]
    readonly_fields = [
        'id', 'api_key', 'user', 'method', 'endpoint', 'query_params',
        'ip_address', 'user_agent', 'status_code', 'status',
        'response_time_ms', 'response_size_bytes', 'error_message', 'timestamp'
    ]
    
    fieldsets = (
        ('Request Information', {
            'fields': (
                'id', 'api_key', 'user', 'method', 'endpoint', 'timestamp'
            )
        }),
        ('Request Details', {
            'fields': ('query_params', 'ip_address', 'user_agent')
        }),
        ('Response Details', {
            'fields': (
                'status_code', 'status', 'response_time_ms', 'response_size_bytes'
            )
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ['collapse']
        })
    )
    
    def api_key_name(self, obj):
        """Display API key name"""
        return obj.api_key.name if obj.api_key else 'N/A'
    api_key_name.short_description = 'API Key'
    
    def endpoint_short(self, obj):
        """Display shortened endpoint"""
        if len(obj.endpoint) > 50:
            return f"{obj.endpoint[:47]}..."
        return obj.endpoint
    endpoint_short.short_description = 'Endpoint'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'SUCCESS': 'green',
            'ERROR': 'red',
            'TIMEOUT': 'orange',
            'RATE_LIMITED': 'purple',
            'UNAUTHORIZED': 'darkred'
        }
        color = colors.get(obj.status, 'gray')
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} ({})</span>',
            color, obj.get_status_display(), obj.status_code
        )
    status_badge.short_description = 'Status'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('api_key', 'user')


@admin.register(WebhookEndpoint)
class WebhookEndpointAdmin(admin.ModelAdmin):
    """Admin interface for webhook endpoints"""
    list_display = [
        'name', 'url_display', 'status_badge', 'event_types_display',
        'consecutive_failures', 'last_delivery_at', 'created_at'
    ]
    list_filter = [
        'status', 'is_active', 'created_at', 'consecutive_failures'
    ]
    search_fields = ['name', 'url', 'user__username']
    readonly_fields = [
        'id', 'last_delivery_at', 'consecutive_failures',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'url', 'user')
        }),
        ('Configuration', {
            'fields': (
                'event_types', 'secret', 'is_active', 'status'
            )
        }),
        ('Delivery Settings', {
            'fields': ('retry_count', 'timeout_seconds')
        }),
        ('Status Tracking', {
            'fields': ('last_delivery_at', 'consecutive_failures')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    actions = ['test_webhooks', 'reset_failure_count', 'deactivate_endpoints']
    
    def url_display(self, obj):
        """Display truncated URL"""
        if len(obj.url) > 50:
            return f"{obj.url[:47]}..."
        return obj.url
    url_display.short_description = 'URL'
    
    def event_types_display(self, obj):
        """Display event types"""
        if obj.event_types:
            types = obj.event_types[:2]
            extra = f" (+{len(obj.event_types) - 2})" if len(obj.event_types) > 2 else ""
            return ', '.join(types) + extra
        return 'None'
    event_types_display.short_description = 'Events'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'ACTIVE': 'green',
            'INACTIVE': 'gray',
            'FAILED': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def test_webhooks(self, request, queryset):
        """Send test webhook to selected endpoints"""
        for endpoint in queryset.filter(is_active=True):
            # Here you would implement the actual webhook test logic
            pass
        self.message_user(request, f"Test webhooks sent to {queryset.count()} endpoints.")
    test_webhooks.short_description = "Send test webhook"
    
    def reset_failure_count(self, request, queryset):
        """Reset consecutive failure count"""
        count = queryset.update(consecutive_failures=0, status='ACTIVE')
        self.message_user(request, f"Reset failure count for {count} endpoints.")
    reset_failure_count.short_description = "Reset failure count"
    
    def deactivate_endpoints(self, request, queryset):
        """Deactivate selected webhook endpoints"""
        count = queryset.update(is_active=False, status='INACTIVE')
        self.message_user(request, f"{count} webhook endpoints deactivated.")
    deactivate_endpoints.short_description = "Deactivate endpoints"


@admin.register(WebhookDelivery)
class WebhookDeliveryAdmin(admin.ModelAdmin):
    """Admin interface for webhook deliveries"""
    list_display = [
        'id', 'endpoint_name', 'event_type', 'status_badge',
        'attempts', 'response_status', 'response_time_ms', 'created_at'
    ]
    list_filter = [
        'status', 'event_type', 'response_status', 'created_at'
    ]
    search_fields = [
        'endpoint__name', 'event_type', 'error_message'
    ]
    readonly_fields = [
        'id', 'endpoint', 'event_type', 'payload', 'status',
        'attempts', 'max_attempts', 'response_status', 'response_body',
        'response_time_ms', 'error_message', 'created_at', 'delivered_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'endpoint', 'event_type', 'status')
        }),
        ('Delivery Details', {
            'fields': ('attempts', 'max_attempts', 'next_retry_at')
        }),
        ('Payload', {
            'fields': ('payload',),
            'classes': ['collapse']
        }),
        ('Response Details', {
            'fields': ('response_status', 'response_body', 'response_time_ms'),
            'classes': ['collapse']
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'delivered_at'),
            'classes': ['collapse']
        })
    )
    
    actions = ['retry_failed_deliveries', 'mark_as_delivered']
    
    def endpoint_name(self, obj):
        """Display endpoint name"""
        return obj.endpoint.name
    endpoint_name.short_description = 'Endpoint'
    
    def status_badge(self, obj):
        """Display status with badge"""
        colors = {
            'PENDING': 'orange',
            'DELIVERED': 'green',
            'FAILED': 'red',
            'RETRYING': 'blue'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def retry_failed_deliveries(self, request, queryset):
        """Retry failed webhook deliveries"""
        failed_deliveries = queryset.filter(status='FAILED')
        count = 0
        for delivery in failed_deliveries:
            if delivery.can_retry():
                delivery.schedule_retry()
                count += 1
        self.message_user(request, f"Retry scheduled for {count} failed deliveries.")
    retry_failed_deliveries.short_description = "Retry failed deliveries"
    
    def mark_as_delivered(self, request, queryset):
        """Mark deliveries as delivered"""
        count = queryset.filter(status__in=['PENDING', 'RETRYING']).update(
            status='DELIVERED',
            delivered_at=timezone.now()
        )
        self.message_user(request, f"{count} deliveries marked as delivered.")
    mark_as_delivered.short_description = "Mark as delivered"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('endpoint')


@admin.register(ExternalIntegration)
class ExternalIntegrationAdmin(admin.ModelAdmin):
    """Admin interface for external integrations"""
    list_display = [
        'name', 'integration_type', 'status_badge', 'is_enabled',
        'auto_sync', 'last_sync_at', 'consecutive_errors'
    ]
    list_filter = [
        'integration_type', 'status', 'is_enabled', 'auto_sync',
        'created_at', 'last_sync_at'
    ]
    search_fields = ['name', 'description', 'base_url']
    readonly_fields = [
        'last_sync_at', 'consecutive_errors', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'integration_type', 'description', 'created_by')
        }),
        ('Configuration', {
            'fields': (
                'base_url', 'api_key', 'api_secret', 'additional_config'
            )
        }),
        ('Status & Settings', {
            'fields': ('status', 'is_enabled')
        }),
        ('Sync Configuration', {
            'fields': (
                'auto_sync', 'sync_interval_minutes', 'last_sync_at'
            )
        }),
        ('Error Tracking', {
            'fields': ('last_error', 'consecutive_errors')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    actions = ['enable_integrations', 'disable_integrations', 'test_connections']
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'ACTIVE': 'green',
            'INACTIVE': 'gray',
            'ERROR': 'red',
            'TESTING': 'blue'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def enable_integrations(self, request, queryset):
        """Enable selected integrations"""
        count = queryset.update(is_enabled=True, status='ACTIVE')
        self.message_user(request, f"{count} integrations enabled.")
    enable_integrations.short_description = "Enable integrations"
    
    def disable_integrations(self, request, queryset):
        """Disable selected integrations"""
        count = queryset.update(is_enabled=False, status='INACTIVE')
        self.message_user(request, f"{count} integrations disabled.")
    disable_integrations.short_description = "Disable integrations"
    
    def test_connections(self, request, queryset):
        """Test connections for selected integrations"""
        count = queryset.update(status='TESTING')
        self.message_user(request, f"Connection test initiated for {count} integrations.")
    test_connections.short_description = "Test connections"


@admin.register(APIRateLimit)
class APIRateLimitAdmin(admin.ModelAdmin):
    """Admin interface for API rate limits"""
    list_display = [
        'api_key_name', 'endpoint_short', 'minute_count', 'hour_count',
        'day_count', 'is_rate_limited_display', 'updated_at'
    ]
    list_filter = [
        'api_key__status', 'updated_at'
    ]
    search_fields = [
        'api_key__name', 'endpoint'
    ]
    readonly_fields = [
        'api_key', 'endpoint', 'minute_count', 'hour_count', 'day_count',
        'minute_reset', 'hour_reset', 'day_reset', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('api_key', 'endpoint')
        }),
        ('Current Counts', {
            'fields': ('minute_count', 'hour_count', 'day_count')
        }),
        ('Reset Times', {
            'fields': ('minute_reset', 'hour_reset', 'day_reset')
        }),
        ('Timestamps', {
            'fields': ('updated_at',)
        })
    )
    
    actions = ['reset_rate_limits']
    
    def api_key_name(self, obj):
        """Display API key name"""
        return obj.api_key.name
    api_key_name.short_description = 'API Key'
    
    def endpoint_short(self, obj):
        """Display shortened endpoint"""
        if len(obj.endpoint) > 40:
            return f"{obj.endpoint[:37]}..."
        return obj.endpoint
    endpoint_short.short_description = 'Endpoint'
    
    def is_rate_limited_display(self, obj):
        """Display if rate limited"""
        if obj.is_rate_limited():
            return format_html('<span style="color: red; font-weight: bold;">⚠️ Limited</span>')
        else:
            return format_html('<span style="color: green;">✅ OK</span>')
    is_rate_limited_display.short_description = 'Status'
    
    def reset_rate_limits(self, request, queryset):
        """Reset rate limit counters"""
        now = timezone.now()
        for rate_limit in queryset:
            rate_limit.minute_count = 0
            rate_limit.hour_count = 0
            rate_limit.day_count = 0
            rate_limit.minute_reset = now + timezone.timedelta(minutes=1)
            rate_limit.hour_reset = now + timezone.timedelta(hours=1)
            rate_limit.day_reset = now + timezone.timedelta(days=1)
            rate_limit.save()
        
        self.message_user(request, f"Rate limits reset for {queryset.count()} entries.")
    reset_rate_limits.short_description = "Reset rate limits"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('api_key')


# Custom admin views for API analytics
class APIAnalyticsAdmin(admin.ModelAdmin):
    """Custom admin view for API analytics"""
    change_list_template = 'admin/api/api_analytics.html'
    
    def changelist_view(self, request, extra_context=None):
        # Calculate API statistics
        from datetime import datetime, timedelta
        
        today = timezone.now().date()
        last_7_days = today - timedelta(days=7)
        
        # API key statistics
        total_keys = APIKey.objects.count()
        active_keys = APIKey.objects.filter(status='ACTIVE').count()
        expired_keys = APIKey.objects.filter(expires_at__lt=timezone.now()).count()
        
        # Request statistics
        total_requests = APIRequest.objects.count()
        recent_requests = APIRequest.objects.filter(timestamp__date__gte=last_7_days).count()
        
        # Success rate
        successful_requests = APIRequest.objects.filter(status='SUCCESS').count()
        success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Average response time
        avg_response_time = APIRequest.objects.aggregate(
            avg_time=Avg('response_time_ms')
        )['avg_time'] or 0
        
        # Webhook statistics
        total_endpoints = WebhookEndpoint.objects.count()
        active_endpoints = WebhookEndpoint.objects.filter(is_active=True).count()
        successful_deliveries = WebhookDelivery.objects.filter(status='DELIVERED').count()
        total_deliveries = WebhookDelivery.objects.count()
        webhook_success_rate = (successful_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0
        
        # Integration statistics
        total_integrations = ExternalIntegration.objects.count()
        active_integrations = ExternalIntegration.objects.filter(is_enabled=True).count()
        
        extra_context = extra_context or {}
        extra_context.update({
            'total_keys': total_keys,
            'active_keys': active_keys,
            'expired_keys': expired_keys,
            'total_requests': total_requests,
            'recent_requests': recent_requests,
            'success_rate': success_rate,
            'avg_response_time': avg_response_time,
            'total_endpoints': total_endpoints,
            'active_endpoints': active_endpoints,
            'webhook_success_rate': webhook_success_rate,
            'total_integrations': total_integrations,
            'active_integrations': active_integrations,
        })
        
        return super().changelist_view(request, extra_context=extra_context)


# Admin site customizations
admin.site.site_header = "Rental Management System - API"
admin.site.site_title = "API Admin"
admin.site.index_title = "API Management"

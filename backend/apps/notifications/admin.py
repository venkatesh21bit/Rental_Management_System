from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count
from .models import (
    NotificationTemplate, NotificationSetting, Notification,
    ScheduledNotification, NotificationLog, NotificationProvider
)


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Admin interface for notification templates"""
    list_display = [
        'name', 'notification_type', 'channel_badge', 'is_active', 
        'is_system_template', 'delay_minutes', 'created_at'
    ]
    list_filter = [
        'notification_type', 'channel', 'is_active', 'is_system_template',
        'send_immediately', 'created_at'
    ]
    search_fields = ['name', 'subject', 'content']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'notification_type', 'channel', 'is_active', 'is_system_template')
        }),
        ('Content', {
            'fields': ('subject', 'content', 'html_content')
        }),
        ('Template Configuration', {
            'fields': ('available_variables',)
        }),
        ('Scheduling', {
            'fields': ('send_immediately', 'delay_minutes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def channel_badge(self, obj):
        """Display channel with icon"""
        icons = {
            'EMAIL': '📧',
            'SMS': '📱', 
            'PUSH': '🔔',
            'IN_APP': '💬',
            'WHATSAPP': '📞'
        }
        icon = icons.get(obj.channel, '📤')
        return format_html('{} {}', icon, obj.get_channel_display())
    channel_badge.short_description = 'Channel'
    
    def get_readonly_fields(self, request, obj=None):
        """Make system templates read-only except for admins"""
        readonly = list(self.readonly_fields)
        if obj and obj.is_system_template and not request.user.is_superuser:
            readonly.extend(['name', 'notification_type', 'channel', 'is_system_template'])
        return readonly


@admin.register(NotificationSetting)
class NotificationSettingAdmin(admin.ModelAdmin):
    """Admin interface for user notification settings"""
    list_display = [
        'user_name', 'email_enabled', 'sms_enabled', 'push_enabled',
        'whatsapp_enabled', 'email_frequency', 'timezone', 'updated_at'
    ]
    list_filter = [
        'email_frequency', 'timezone', 'push_all_notifications',
        'whatsapp_enabled', 'updated_at'
    ]
    search_fields = ['user__username', 'user__email', 'whatsapp_number']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Email Notifications', {
            'fields': (
                'email_order_confirmations', 'email_pickup_reminders',
                'email_return_reminders', 'email_overdue_notices',
                'email_payment_reminders', 'email_payment_confirmations',
                'email_promotional', 'email_frequency'
            )
        }),
        ('SMS Notifications', {
            'fields': (
                'sms_pickup_reminders', 'sms_return_reminders',
                'sms_overdue_notices', 'sms_payment_reminders',
                'sms_delivery_updates'
            )
        }),
        ('Push Notifications', {
            'fields': (
                'push_all_notifications', 'push_order_updates',
                'push_payment_updates', 'push_promotional'
            )
        }),
        ('WhatsApp', {
            'fields': ('whatsapp_enabled', 'whatsapp_number')
        }),
        ('Preferences', {
            'fields': ('quiet_hours_start', 'quiet_hours_end', 'timezone')
        })
    )
    
    def user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    user_name.short_description = 'User'
    
    def email_enabled(self, obj):
        return "✅" if obj.email_order_confirmations else "❌"
    email_enabled.short_description = 'Email'
    
    def sms_enabled(self, obj):
        return "✅" if obj.sms_pickup_reminders else "❌"
    sms_enabled.short_description = 'SMS'
    
    def push_enabled(self, obj):
        return "✅" if obj.push_all_notifications else "❌"
    push_enabled.short_description = 'Push'
    
    def whatsapp_enabled(self, obj):
        return "✅" if obj.whatsapp_enabled else "❌"
    whatsapp_enabled.short_description = 'WhatsApp'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for notifications"""
    list_display = [
        'notification_type', 'user_name', 'channel_badge', 'status_badge',
        'priority_badge', 'scheduled_for', 'sent_at', 'retry_count', 'created_at'
    ]
    list_filter = [
        'notification_type', 'channel', 'status', 'priority',
        'scheduled_for', 'sent_at', 'created_at'
    ]
    search_fields = [
        'user__username', 'user__email', 'subject', 'content',
        'email', 'phone'
    ]
    readonly_fields = [
        'id', 'sent_at', 'delivered_at', 'read_at', 'provider_message_id',
        'provider_response', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'notification_type', 'channel', 'template')
        }),
        ('Recipients', {
            'fields': ('user', 'email', 'phone')
        }),
        ('Content', {
            'fields': ('subject', 'content', 'html_content')
        }),
        ('Context & References', {
            'fields': ('order', 'reservation', 'invoice', 'context_data'),
            'classes': ['collapse']
        }),
        ('Scheduling & Priority', {
            'fields': ('scheduled_for', 'priority')
        }),
        ('Status & Tracking', {
            'fields': (
                'status', 'sent_at', 'delivered_at', 'read_at',
                'provider_message_id', 'provider_response'
            )
        }),
        ('Error Handling', {
            'fields': ('retry_count', 'max_retries', 'error_message'),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    actions = ['retry_failed_notifications', 'mark_as_sent', 'cancel_notifications']
    
    def user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    user_name.short_description = 'User'
    
    def channel_badge(self, obj):
        icons = {
            'EMAIL': '📧',
            'SMS': '📱',
            'PUSH': '🔔',
            'IN_APP': '💬',
            'WHATSAPP': '📞'
        }
        icon = icons.get(obj.channel, '📤')
        return format_html('{} {}', icon, obj.get_channel_display())
    channel_badge.short_description = 'Channel'
    
    def status_badge(self, obj):
        colors = {
            'PENDING': 'orange',
            'SCHEDULED': 'blue',
            'SENT': 'green',
            'DELIVERED': 'darkgreen',
            'FAILED': 'red',
            'CANCELLED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def priority_badge(self, obj):
        colors = {
            'LOW': 'gray',
            'NORMAL': 'blue',
            'HIGH': 'orange',
            'URGENT': 'red'
        }
        color = colors.get(obj.priority, 'blue')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def retry_failed_notifications(self, request, queryset):
        """Retry failed notifications"""
        count = 0
        for notification in queryset.filter(status='FAILED'):
            if notification.retry():
                count += 1
        self.message_user(request, f"{count} notifications queued for retry.")
    retry_failed_notifications.short_description = "Retry failed notifications"
    
    def mark_as_sent(self, request, queryset):
        """Mark notifications as sent"""
        count = queryset.filter(status='PENDING').update(
            status='SENT',
            sent_at=timezone.now()
        )
        self.message_user(request, f"{count} notifications marked as sent.")
    mark_as_sent.short_description = "Mark as sent"
    
    def cancel_notifications(self, request, queryset):
        """Cancel pending notifications"""
        count = queryset.filter(status__in=['PENDING', 'SCHEDULED']).update(
            status='CANCELLED'
        )
        self.message_user(request, f"{count} notifications cancelled.")
    cancel_notifications.short_description = "Cancel notifications"


@admin.register(ScheduledNotification)
class ScheduledNotificationAdmin(admin.ModelAdmin):
    """Admin interface for scheduled notifications"""
    list_display = [
        'name', 'schedule_type', 'frequency', 'template_name',
        'active_badge', 'next_run_at', 'last_run_at', 'is_active'
    ]
    list_filter = [
        'schedule_type', 'frequency', 'is_active',
        'next_run_at', 'last_run_at'
    ]
    search_fields = ['name', 'template__name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'schedule_type', 'template', 'is_active')
        }),
        ('Schedule Configuration', {
            'fields': ('frequency', 'send_time')
        }),
        ('Trigger Conditions', {
            'fields': ('days_before_event', 'days_after_event')
        }),
        ('Execution Tracking', {
            'fields': ('last_run_at', 'next_run_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    readonly_fields = ['last_run_at', 'next_run_at', 'created_at', 'updated_at']
    
    def template_name(self, obj):
        return obj.template.name
    template_name.short_description = 'Template'
    
    def active_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">Active</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">Inactive</span>'
            )
    active_badge.short_description = 'Status'


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """Admin interface for notification logs"""
    list_display = [
        'operation', 'started_at', 'completion_time', 'total_notifications',
        'successful_notifications', 'failed_notifications', 'success_rate',
        'triggered_by_user', 'is_scheduled'
    ]
    list_filter = [
        'operation', 'is_scheduled', 'started_at', 'completed_at'
    ]
    search_fields = ['operation', 'triggered_by__username']
    readonly_fields = [
        'started_at', 'completed_at', 'total_notifications',
        'successful_notifications', 'failed_notifications'
    ]
    
    fieldsets = (
        ('Operation Details', {
            'fields': ('operation', 'is_scheduled', 'triggered_by')
        }),
        ('Execution', {
            'fields': ('started_at', 'completed_at')
        }),
        ('Statistics', {
            'fields': (
                'total_notifications', 'successful_notifications',
                'failed_notifications'
            )
        }),
        ('Configuration', {
            'fields': ('filters_applied', 'errors'),
            'classes': ['collapse']
        })
    )
    
    def completion_time(self, obj):
        if obj.completed_at and obj.started_at:
            delta = obj.completed_at - obj.started_at
            return f"{delta.total_seconds():.1f}s"
        return "Running..." if not obj.completed_at else "N/A"
    completion_time.short_description = 'Duration'
    
    def success_rate(self, obj):
        if obj.total_notifications > 0:
            rate = (obj.successful_notifications / obj.total_notifications) * 100
            color = 'green' if rate >= 90 else 'orange' if rate >= 70 else 'red'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
                color, rate
            )
        return "N/A"
    success_rate.short_description = 'Success Rate'
    
    def triggered_by_user(self, obj):
        return obj.triggered_by.username if obj.triggered_by else "System"
    triggered_by_user.short_description = 'Triggered By'


@admin.register(NotificationProvider)
class NotificationProviderAdmin(admin.ModelAdmin):
    """Admin interface for notification providers"""
    list_display = [
        'name', 'provider_type', 'channel_badge', 'is_active',
        'is_default', 'rate_limits', 'created_at'
    ]
    list_filter = [
        'provider_type', 'channel', 'is_active', 'is_default', 'created_at'
    ]
    search_fields = ['name', 'provider_type']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'provider_type', 'channel', 'is_active', 'is_default')
        }),
        ('API Configuration', {
            'fields': ('api_key', 'api_secret', 'api_endpoint'),
            'classes': ['collapse']
        }),
        ('Additional Settings', {
            'fields': ('configuration',),
            'classes': ['collapse']
        }),
        ('Rate Limiting', {
            'fields': (
                'rate_limit_per_minute', 'rate_limit_per_hour', 'rate_limit_per_day'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def channel_badge(self, obj):
        icons = {
            'EMAIL': '📧',
            'SMS': '📱',
            'PUSH': '🔔',
            'IN_APP': '💬',
            'WHATSAPP': '📞'
        }
        icon = icons.get(obj.channel, '📤')
        return format_html('{} {}', icon, obj.get_channel_display())
    channel_badge.short_description = 'Channel'
    
    def rate_limits(self, obj):
        limits = []
        if obj.rate_limit_per_minute:
            limits.append(f"{obj.rate_limit_per_minute}/min")
        if obj.rate_limit_per_hour:
            limits.append(f"{obj.rate_limit_per_hour}/hr")
        if obj.rate_limit_per_day:
            limits.append(f"{obj.rate_limit_per_day}/day")
        return ", ".join(limits) or "No limits"
    rate_limits.short_description = 'Rate Limits'


# Admin site customizations
admin.site.site_header = "Rental Management System - Notifications"
admin.site.site_title = "Notifications Admin"
admin.site.index_title = "Notification Management"

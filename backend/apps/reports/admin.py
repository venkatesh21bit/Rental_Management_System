from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Avg, Sum
from .models import (
    ReportTemplate, Report, ScheduledReport, 
    DashboardWidget, Analytics, ReportAccess
)


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    """Admin interface for report templates"""
    list_display = [
        'name', 'report_type', 'is_active', 'is_public',
        'can_be_scheduled', 'default_format', 'created_by', 'created_at'
    ]
    list_filter = [
        'report_type', 'is_active', 'is_public', 'can_be_scheduled',
        'default_format', 'is_system_template', 'created_at'
    ]
    search_fields = ['name', 'description', 'report_type']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'report_type', 'description', 'created_by')
        }),
        ('Query Configuration', {
            'fields': ('base_query', 'filters', 'columns')
        }),
        ('Output Settings', {
            'fields': ('default_format',)
        }),
        ('Access Control', {
            'fields': ('is_public', 'allowed_roles')
        }),
        ('Template Settings', {
            'fields': ('is_active', 'can_be_scheduled', 'is_system_template')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    actions = ['activate_templates', 'deactivate_templates', 'make_public']
    
    def activate_templates(self, request, queryset):
        """Activate selected templates"""
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} templates activated.")
    activate_templates.short_description = "Activate selected templates"
    
    def deactivate_templates(self, request, queryset):
        """Deactivate selected templates"""
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} templates deactivated.")
    deactivate_templates.short_description = "Deactivate selected templates"
    
    def make_public(self, request, queryset):
        """Make templates public"""
        count = queryset.update(is_public=True)
        self.message_user(request, f"{count} templates made public.")
    make_public.short_description = "Make public"


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Admin interface for generated reports"""
    list_display = [
        'name', 'template_name', 'status_badge', 'output_format',
        'total_records', 'file_size_display', 'requested_by',
        'requested_at', 'completed_at', 'expires_at'
    ]
    list_filter = [
        'status', 'output_format', 'template__report_type',
        'requested_at', 'completed_at', 'is_shared'
    ]
    search_fields = [
        'name', 'template__name', 'requested_by__username',
        'requested_by__email'
    ]
    readonly_fields = [
        'id', 'template', 'status', 'file_path', 'file_size',
        'total_records', 'generation_time_seconds', 'error_message',
        'requested_at', 'started_at', 'completed_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'template', 'requested_by')
        }),
        ('Parameters', {
            'fields': (
                'filters_applied', 'date_range_start', 'date_range_end',
                'output_format'
            )
        }),
        ('Generation Status', {
            'fields': (
                'status', 'total_records', 'generation_time_seconds'
            )
        }),
        ('File Information', {
            'fields': ('file_path', 'file_size')
        }),
        ('Sharing', {
            'fields': ('is_shared', 'shared_with')
        }),
        ('Timestamps', {
            'fields': ('requested_at', 'started_at', 'completed_at', 'expires_at')
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ['collapse']
        })
    )
    
    actions = ['mark_as_expired', 'regenerate_reports', 'share_reports']
    
    def template_name(self, obj):
        """Display template name"""
        return obj.template.name
    template_name.short_description = 'Template'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'GENERATING': 'blue',
            'COMPLETED': 'green',
            'FAILED': 'red',
            'EXPIRED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def file_size_display(self, obj):
        """Display file size in human readable format"""
        if obj.file_size:
            if obj.file_size < 1024:
                return f"{obj.file_size} B"
            elif obj.file_size < 1024 * 1024:
                return f"{obj.file_size / 1024:.1f} KB"
            else:
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
        return "N/A"
    file_size_display.short_description = 'File Size'
    
    def mark_as_expired(self, request, queryset):
        """Mark selected reports as expired"""
        count = queryset.filter(status='COMPLETED').update(status='EXPIRED')
        self.message_user(request, f"{count} reports marked as expired.")
    mark_as_expired.short_description = "Mark as expired"
    
    def regenerate_reports(self, request, queryset):
        """Queue reports for regeneration"""
        failed_reports = queryset.filter(status__in=['FAILED', 'EXPIRED'])
        count = failed_reports.update(status='PENDING', error_message='')
        self.message_user(request, f"{count} reports queued for regeneration.")
    regenerate_reports.short_description = "Regenerate reports"
    
    def share_reports(self, request, queryset):
        """Mark reports as shared"""
        count = queryset.filter(status='COMPLETED').update(is_shared=True)
        self.message_user(request, f"{count} reports marked as shared.")
    share_reports.short_description = "Mark as shared"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('template', 'requested_by')


@admin.register(ScheduledReport)
class ScheduledReportAdmin(admin.ModelAdmin):
    """Admin interface for scheduled reports"""
    list_display = [
        'name', 'template_name', 'frequency', 'status_badge',
        'schedule_time', 'next_run_at', 'last_run_at',
        'consecutive_failures', 'auto_send_email'
    ]
    list_filter = [
        'frequency', 'status', 'auto_send_email',
        'template__report_type', 'created_at'
    ]
    search_fields = [
        'name', 'template__name', 'email_recipients',
        'created_by__username'
    ]
    readonly_fields = [
        'last_run_at', 'next_run_at', 'last_report',
        'consecutive_failures', 'last_error',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'template', 'created_by')
        }),
        ('Scheduling', {
            'fields': ('frequency', 'schedule_time', 'status')
        }),
        ('Parameters', {
            'fields': ('default_filters', 'output_format')
        }),
        ('Email Settings', {
            'fields': ('auto_send_email', 'email_recipients')
        }),
        ('Execution Tracking', {
            'fields': ('last_run_at', 'next_run_at', 'last_report')
        }),
        ('Error Handling', {
            'fields': (
                'consecutive_failures', 'max_failures', 'last_error'
            ),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    actions = ['activate_schedules', 'pause_schedules', 'run_now']
    
    def template_name(self, obj):
        """Display template name"""
        return obj.template.name
    template_name.short_description = 'Template'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'ACTIVE': 'green',
            'PAUSED': 'orange',
            'INACTIVE': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def activate_schedules(self, request, queryset):
        """Activate selected schedules"""
        count = queryset.update(status='ACTIVE', consecutive_failures=0)
        for schedule in queryset:
            schedule.calculate_next_run()
        self.message_user(request, f"{count} schedules activated.")
    activate_schedules.short_description = "Activate schedules"
    
    def pause_schedules(self, request, queryset):
        """Pause selected schedules"""
        count = queryset.update(status='PAUSED')
        self.message_user(request, f"{count} schedules paused.")
    pause_schedules.short_description = "Pause schedules"
    
    def run_now(self, request, queryset):
        """Trigger immediate execution"""
        active_schedules = queryset.filter(status='ACTIVE')
        count = active_schedules.count()
        # Here you would implement the actual execution logic
        self.message_user(request, f"Immediate execution triggered for {count} schedules.")
    run_now.short_description = "Run now"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('template', 'created_by', 'last_report')


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    """Admin interface for dashboard widgets"""
    list_display = [
        'name', 'widget_type', 'chart_type', 'is_active',
        'position_display', 'size_display', 'refresh_interval',
        'last_updated', 'created_by'
    ]
    list_filter = [
        'widget_type', 'chart_type', 'is_active', 'is_public',
        'created_at', 'last_updated'
    ]
    search_fields = ['name', 'title', 'description']
    readonly_fields = [
        'cached_data', 'last_updated', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'title', 'description', 'created_by')
        }),
        ('Widget Configuration', {
            'fields': ('widget_type', 'chart_type', 'data_source')
        }),
        ('Layout', {
            'fields': (
                'width', 'height', 'position_x', 'position_y'
            )
        }),
        ('Refresh Settings', {
            'fields': ('refresh_interval', 'last_updated')
        }),
        ('Styling', {
            'fields': ('color_scheme', 'display_options'),
            'classes': ['collapse']
        }),
        ('Access Control', {
            'fields': ('is_active', 'is_public', 'allowed_roles')
        }),
        ('Cache', {
            'fields': ('cached_data',),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    actions = ['refresh_widgets', 'activate_widgets', 'clear_cache']
    
    def position_display(self, obj):
        """Display widget position"""
        return f"({obj.position_x}, {obj.position_y})"
    position_display.short_description = 'Position'
    
    def size_display(self, obj):
        """Display widget size"""
        return f"{obj.width} × {obj.height}"
    size_display.short_description = 'Size'
    
    def refresh_widgets(self, request, queryset):
        """Force refresh widget data"""
        count = queryset.update(last_updated=None)
        self.message_user(request, f"Refresh triggered for {count} widgets.")
    refresh_widgets.short_description = "Force refresh"
    
    def activate_widgets(self, request, queryset):
        """Activate selected widgets"""
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} widgets activated.")
    activate_widgets.short_description = "Activate widgets"
    
    def clear_cache(self, request, queryset):
        """Clear widget cache"""
        count = queryset.update(cached_data={}, last_updated=None)
        self.message_user(request, f"Cache cleared for {count} widgets.")
    clear_cache.short_description = "Clear cache"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('created_by')


@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    """Admin interface for analytics data"""
    list_display = [
        'metric_type', 'date', 'value_display', 'secondary_value_display',
        'entity_type', 'entity_id', 'calculated_at'
    ]
    list_filter = [
        'metric_type', 'entity_type', 'date', 'calculated_at'
    ]
    search_fields = ['metric_type', 'entity_type', 'entity_id']
    readonly_fields = [
        'metric_type', 'date', 'value', 'secondary_value',
        'entity_id', 'entity_type', 'metadata', 'calculated_at'
    ]
    
    fieldsets = (
        ('Metric Information', {
            'fields': ('metric_type', 'date', 'calculated_at')
        }),
        ('Values', {
            'fields': ('value', 'secondary_value')
        }),
        ('Entity Context', {
            'fields': ('entity_type', 'entity_id')
        }),
        ('Additional Data', {
            'fields': ('metadata',),
            'classes': ['collapse']
        })
    )
    
    def value_display(self, obj):
        """Display primary value formatted"""
        return format_html(
            '<span style="font-weight: bold;">{}</span>',
            obj.value
        )
    value_display.short_description = 'Value'
    
    def secondary_value_display(self, obj):
        """Display secondary value if available"""
        if obj.secondary_value is not None:
            return format_html(
                '<span style="color: gray;">{}</span>',
                obj.secondary_value
            )
        return "—"
    secondary_value_display.short_description = 'Secondary Value'


@admin.register(ReportAccess)
class ReportAccessAdmin(admin.ModelAdmin):
    """Admin interface for report access logs"""
    list_display = [
        'report_name', 'user', 'action_type_badge',
        'ip_address', 'accessed_at'
    ]
    list_filter = [
        'action_type', 'accessed_at', 'user'
    ]
    search_fields = [
        'report__name', 'user__username', 'user__email',
        'ip_address', 'user_agent'
    ]
    readonly_fields = [
        'report', 'user', 'action_type', 'ip_address',
        'user_agent', 'accessed_at'
    ]
    
    fieldsets = (
        ('Access Information', {
            'fields': ('report', 'user', 'action_type', 'accessed_at')
        }),
        ('Request Details', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ['collapse']
        })
    )
    
    def report_name(self, obj):
        """Display report name"""
        return obj.report.name
    report_name.short_description = 'Report'
    
    def action_type_badge(self, obj):
        """Display action type with color coding"""
        colors = {
            'VIEW': 'blue',
            'DOWNLOAD': 'green',
            'SHARE': 'orange',
            'DELETE': 'red'
        }
        color = colors.get(obj.action_type, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_action_type_display()
        )
    action_type_badge.short_description = 'Action'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('report', 'user')


# Custom admin views for reports analytics
class ReportsAnalyticsAdmin(admin.ModelAdmin):
    """Custom admin view for reports analytics"""
    change_list_template = 'admin/reports/reports_analytics.html'
    
    def changelist_view(self, request, extra_context=None):
        # Calculate report statistics
        from datetime import datetime, timedelta
        
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)
        
        # Template statistics
        total_templates = ReportTemplate.objects.count()
        active_templates = ReportTemplate.objects.filter(is_active=True).count()
        public_templates = ReportTemplate.objects.filter(is_public=True).count()
        
        # Report statistics
        total_reports = Report.objects.count()
        completed_reports = Report.objects.filter(status='COMPLETED').count()
        failed_reports = Report.objects.filter(status='FAILED').count()
        recent_reports = Report.objects.filter(requested_at__date__gte=last_30_days).count()
        
        # Success rate
        success_rate = (completed_reports / total_reports * 100) if total_reports > 0 else 0
        
        # Average generation time
        avg_generation_time = Report.objects.filter(
            status='COMPLETED',
            generation_time_seconds__isnull=False
        ).aggregate(avg_time=Avg('generation_time_seconds'))['avg_time'] or 0
        
        # Scheduled reports statistics
        total_scheduled = ScheduledReport.objects.count()
        active_scheduled = ScheduledReport.objects.filter(status='ACTIVE').count()
        
        # Dashboard widgets statistics
        total_widgets = DashboardWidget.objects.count()
        active_widgets = DashboardWidget.objects.filter(is_active=True).count()
        
        # Analytics data points
        analytics_count = Analytics.objects.count()
        recent_analytics = Analytics.objects.filter(calculated_at__date__gte=last_30_days).count()
        
        # Most popular report types
        popular_types = Report.objects.values(
            'template__report_type'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        extra_context = extra_context or {}
        extra_context.update({
            'total_templates': total_templates,
            'active_templates': active_templates,
            'public_templates': public_templates,
            'total_reports': total_reports,
            'completed_reports': completed_reports,
            'failed_reports': failed_reports,
            'recent_reports': recent_reports,
            'success_rate': success_rate,
            'avg_generation_time': avg_generation_time,
            'total_scheduled': total_scheduled,
            'active_scheduled': active_scheduled,
            'total_widgets': total_widgets,
            'active_widgets': active_widgets,
            'analytics_count': analytics_count,
            'recent_analytics': recent_analytics,
            'popular_types': popular_types,
        })
        
        return super().changelist_view(request, extra_context=extra_context)


# Admin site customizations
admin.site.site_header = "Rental Management System - Reports"
admin.site.site_title = "Reports Admin"
admin.site.index_title = "Reports & Analytics Management"

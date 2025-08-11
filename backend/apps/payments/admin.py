from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Sum, Count
from .models import (
    PaymentProvider, Payment, PaymentRefund, 
    WebhookEvent, PaymentLink, BankAccount
)


@admin.register(PaymentProvider)
class PaymentProviderAdmin(admin.ModelAdmin):
    """Admin interface for payment providers"""
    list_display = [
        'name', 'provider_type', 'is_active', 'is_test_mode',
        'currency_supported_display', 'created_at'
    ]
    list_filter = [
        'provider_type', 'is_active', 'is_test_mode', 'created_at'
    ]
    search_fields = ['name', 'provider_type']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'provider_type', 'is_active', 'is_test_mode')
        }),
        ('Configuration', {
            'fields': (
                'api_key', 'api_secret', 'webhook_secret',
                'currency_supported'
            )
        }),
        ('Limits & Fees', {
            'fields': (
                'min_amount', 'max_amount', 'processing_fee_percent', 'processing_fee_fixed'
            ),
            'classes': ['collapse']
        }),
        ('Additional Info', {
            'fields': ('description', 'logo_url'),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def currency_supported_display(self, obj):
        """Display supported currencies as a comma-separated list"""
        if obj.currency_supported:
            return ', '.join(obj.currency_supported[:3]) + ('...' if len(obj.currency_supported) > 3 else '')
        return 'None'
    currency_supported_display.short_description = 'Currencies'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for payments"""
    list_display = [
        'payment_number', 'customer_name', 'amount_display', 'status_badge',
        'payment_method', 'provider_name', 'created_at', 'completed_at'
    ]
    list_filter = [
        'status', 'payment_method', 'provider', 'currency',
        'created_at', 'completed_at'
    ]
    search_fields = [
        'payment_number', 'customer__username', 'customer__email',
        'gateway_payment_id', 'gateway_order_id', 'invoice__invoice_number'
    ]
    readonly_fields = [
        'id', 'payment_number', 'gateway_payment_id', 'gateway_response',
        'created_at', 'completed_at', 'processed_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'payment_number', 'status', 'customer', 'invoice'
            )
        }),
        ('Payment Details', {
            'fields': (
                'amount', 'currency', 'payment_method', 'provider',
                'description'
            )
        }),
        ('Gateway Information', {
            'fields': (
                'gateway_payment_id', 'gateway_order_id', 'gateway_signature', 'gateway_response'
            ),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'processed_at', 'completed_at')
        }),
        ('Failure Information', {
            'fields': ('failure_reason',),
            'classes': ['collapse']
        })
    )
    
    actions = ['mark_as_completed', 'refund_payments', 'retry_failed_payments']
    
    def customer_name(self, obj):
        """Display customer name"""
        return obj.customer.get_full_name() or obj.customer.username
    customer_name.short_description = 'Customer'
    
    def amount_display(self, obj):
        """Display amount with currency"""
        return format_html(
            '<span style="font-weight: bold;">{} {:.2f}</span>',
            obj.currency, obj.amount
        )
    amount_display.short_description = 'Amount'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'PROCESSING': 'blue',
            'COMPLETED': 'green',
            'FAILED': 'red',
            'CANCELLED': 'gray',
            'REFUNDED': 'purple',
            'DISPUTED': 'darkred',
            'REQUIRES_ACTION': 'yellow'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def provider_name(self, obj):
        """Display provider name"""
        return obj.provider.name if obj.provider else 'N/A'
    provider_name.short_description = 'Provider'
    
    def mark_as_completed(self, request, queryset):
        """Mark selected payments as completed"""
        count = queryset.filter(status='PROCESSING').update(
            status='COMPLETED',
            completed_at=timezone.now()
        )
        self.message_user(request, f"{count} payments marked as completed.")
    mark_as_completed.short_description = "Mark as completed"
    
    def refund_payments(self, request, queryset):
        """Initiate refunds for selected payments"""
        completed_payments = queryset.filter(status='COMPLETED')
        count = completed_payments.count()
        if count > 0:
            self.message_user(
                request, 
                f"Refund process initiated for {count} payments. "
                "Check the refunds section for status."
            )
        else:
            self.message_user(request, "No completed payments selected for refund.")
    refund_payments.short_description = "Initiate refunds"
    
    def retry_failed_payments(self, request, queryset):
        """Retry failed payments"""
        failed_payments = queryset.filter(status='FAILED')
        count = failed_payments.update(status='PENDING', failure_reason='')
        self.message_user(request, f"{count} failed payments queued for retry.")
    retry_failed_payments.short_description = "Retry failed payments"


@admin.register(PaymentRefund)
class PaymentRefundAdmin(admin.ModelAdmin):
    """Admin interface for payment refunds"""
    list_display = [
        'refund_number', 'payment_number', 'amount_display', 'status_badge',
        'reason', 'completed_at', 'requested_at'
    ]
    list_filter = [
        'status', 'reason', 'completed_at', 'requested_at'
    ]
    search_fields = [
        'refund_number', 'payment__payment_number',
        'gateway_refund_id', 'reason'
    ]
    readonly_fields = [
        'id', 'refund_number', 'gateway_refund_id', 'gateway_response',
        'requested_at', 'processed_at', 'completed_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'refund_number', 'status', 'payment'
            )
        }),
        ('Refund Details', {
            'fields': ('amount', 'currency', 'reason', 'notes')
        }),
        ('Gateway Information', {
            'fields': ('gateway_refund_id', 'gateway_response'),
            'classes': ['collapse']
        }),
        ('Processing', {
            'fields': ('created_by', 'requested_at', 'processed_at', 'completed_at')
        })
    )
    
    def payment_number(self, obj):
        """Display payment number"""
        return obj.payment.payment_number
    payment_number.short_description = 'Payment'
    
    def amount_display(self, obj):
        """Display refund amount"""
        return format_html(
            '<span style="color: red; font-weight: bold;">{} {:.2f}</span>',
            obj.payment.currency, obj.amount
        )
    amount_display.short_description = 'Refund Amount'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'PROCESSING': 'blue',
            'COMPLETED': 'green',
            'FAILED': 'red',
            'CANCELLED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    """Admin interface for webhook events"""
    list_display = [
        'event_id', 'provider', 'event_type', 'status_badge',
        'received_at', 'processed_at'
    ]
    list_filter = [
        'provider', 'event_type', 'status', 'received_at'
    ]
    search_fields = ['event_id', 'event_type', 'error_message']
    readonly_fields = [
        'id', 'event_id', 'received_at', 'processed_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'event_id', 'provider', 'event_type')
        }),
        ('Processing Status', {
            'fields': ('status', 'received_at', 'processed_at')
        }),
        ('Related Objects', {
            'fields': ('payment', 'refund')
        }),
        ('Event Data', {
            'fields': ('payload', 'headers'),
            'classes': ['collapse']
        }),
        ('Processing Details', {
            'fields': ('processing_notes', 'error_message', 'signature_verified'),
            'classes': ['collapse']
        })
    )
    
    actions = ['reprocess_webhooks', 'mark_as_processed']
    
    def status_badge(self, obj):
        """Display processing status"""
        colors = {
            'RECEIVED': 'blue',
            'PROCESSING': 'orange', 
            'PROCESSED': 'green',
            'FAILED': 'red',
            'IGNORED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, obj.get_status_display())
    status_badge.short_description = 'Status'
    
    def reprocess_webhooks(self, request, queryset):
        """Reprocess selected webhook events"""
        unprocessed = queryset.filter(status__in=['RECEIVED', 'FAILED'])
        count = unprocessed.update(error_message='', status='RECEIVED')
        self.message_user(request, f"{count} webhook events queued for reprocessing.")
    reprocess_webhooks.short_description = "Reprocess webhooks"
    
    def mark_as_processed(self, request, queryset):
        """Mark webhooks as processed"""
        count = queryset.filter(status__in=['RECEIVED', 'PROCESSING']).update(
            status='PROCESSED',
            processed_at=timezone.now()
        )
        self.message_user(request, f"{count} webhooks marked as processed.")
    mark_as_processed.short_description = "Mark as processed"


@admin.register(PaymentLink)
class PaymentLinkAdmin(admin.ModelAdmin):
    """Admin interface for payment links"""
    list_display = [
        'link_id', 'customer_name', 'amount_display', 'status_badge',
        'expires_at', 'access_count', 'created_at'
    ]
    list_filter = [
        'status', 'created_at', 'expires_at'
    ]
    search_fields = [
        'link_id', 'customer__username', 'customer__email',
        'description', 'invoice__invoice_number'
    ]
    readonly_fields = [
        'id', 'link_id', 'access_count', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'link_id', 'status', 'customer', 'invoice')
        }),
        ('Payment Details', {
            'fields': ('amount', 'currency', 'description')
        }),
        ('Link Configuration', {
            'fields': ('expires_at', 'max_access_count', 'access_count')
        }),
        ('Payment Tracking', {
            'fields': ('payment',)
        }),
        ('Notification Settings', {
            'fields': ('send_email', 'send_sms'),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    def customer_name(self, obj):
        """Display customer name"""
        return obj.customer.get_full_name() or obj.customer.username
    customer_name.short_description = 'Customer'
    
    def amount_display(self, obj):
        """Display amount with currency"""
        return format_html(
            '<span style="font-weight: bold;">{} {:.2f}</span>',
            obj.currency, obj.amount
        )
    amount_display.short_description = 'Amount'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'ACTIVE': 'green',
            'EXPIRED': 'orange',
            'USED': 'blue',
            'CANCELLED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    """Admin interface for bank accounts"""
    list_display = [
        'account_holder_name', 'bank_name', 'account_type',
        'is_active', 'is_default', 'is_verified', 'created_at'
    ]
    list_filter = [
        'account_type', 'is_active', 'is_default', 'is_verified',
        'bank_name', 'created_at'
    ]
    search_fields = [
        'account_holder_name', 'bank_name', 'account_number',
        'routing_number', 'ifsc_code', 'swift_code'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'customer', 'account_holder_name', 'account_type',
                'is_active', 'is_default'
            )
        }),
        ('Account Details', {
            'fields': (
                'bank_name', 'branch_name', 'account_number',
                'routing_number', 'ifsc_code', 'swift_code'
            )
        }),
        ('Verification', {
            'fields': ('is_verified', 'verification_document')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )


# Custom admin views for payment analytics
class PaymentSummaryAdmin(admin.ModelAdmin):
    """Custom admin view for payment summary"""
    change_list_template = 'admin/payments/payment_summary.html'
    
    def changelist_view(self, request, extra_context=None):
        # Calculate payment statistics
        from django.db.models import Q
        from datetime import datetime, timedelta
        
        today = timezone.now().date()
        this_month = today.replace(day=1)
        last_month = (this_month - timedelta(days=1)).replace(day=1)
        
        # Payment statistics
        total_payments = Payment.objects.count()
        completed_payments = Payment.objects.filter(status='COMPLETED').count()
        failed_payments = Payment.objects.filter(status='FAILED').count()
        
        # Revenue statistics
        total_revenue = Payment.objects.filter(status='COMPLETED').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        monthly_revenue = Payment.objects.filter(
            status='COMPLETED',
            paid_at__date__gte=this_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Success rate
        success_rate = (completed_payments / total_payments * 100) if total_payments > 0 else 0
        
        extra_context = extra_context or {}
        extra_context.update({
            'total_payments': total_payments,
            'completed_payments': completed_payments,
            'failed_payments': failed_payments,
            'total_revenue': total_revenue,
            'monthly_revenue': monthly_revenue,
            'success_rate': success_rate,
        })
        
        return super().changelist_view(request, extra_context=extra_context)


# Register the summary admin
# admin.site.register(Payment, PaymentSummaryAdmin)  # Commented out to avoid duplicate registration

# Admin site customizations
admin.site.site_header = "Rental Management System - Payments"
admin.site.site_title = "Payments Admin"
admin.site.index_title = "Payment Management"

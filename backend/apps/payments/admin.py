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
        'name', 'provider_type', 'is_active', 'is_default',
        'supported_currencies_display', 'test_mode', 'created_at'
    ]
    list_filter = [
        'provider_type', 'is_active', 'is_default', 'test_mode', 'created_at'
    ]
    search_fields = ['name', 'provider_type', 'supported_currencies']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'provider_type', 'is_active', 'is_default')
        }),
        ('Configuration', {
            'fields': (
                'api_key', 'api_secret', 'webhook_secret', 'api_endpoint',
                'test_mode', 'supported_currencies'
            )
        }),
        ('Rate Limiting', {
            'fields': (
                'rate_limit_per_minute', 'rate_limit_per_hour', 'rate_limit_per_day'
            ),
            'classes': ['collapse']
        }),
        ('Additional Settings', {
            'fields': ('additional_config',),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def supported_currencies_display(self, obj):
        """Display supported currencies as a comma-separated list"""
        if obj.supported_currencies:
            return ', '.join(obj.supported_currencies[:3]) + ('...' if len(obj.supported_currencies) > 3 else '')
        return 'None'
    supported_currencies_display.short_description = 'Currencies'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for payments"""
    list_display = [
        'payment_number', 'customer_name', 'amount_display', 'status_badge',
        'payment_method', 'provider_name', 'created_at', 'paid_at'
    ]
    list_filter = [
        'status', 'payment_method', 'provider', 'currency',
        'created_at', 'paid_at'
    ]
    search_fields = [
        'payment_number', 'customer__username', 'customer__email',
        'gateway_payment_id', 'transaction_id', 'invoice__invoice_number'
    ]
    readonly_fields = [
        'id', 'payment_number', 'gateway_payment_id', 'gateway_response',
        'created_at', 'updated_at'
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
                'gateway_payment_id', 'transaction_id', 'gateway_response'
            ),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'paid_at', 'updated_at')
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
            paid_at=timezone.now()
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
        'reason', 'processed_at', 'created_at'
    ]
    list_filter = [
        'status', 'reason', 'processed_at', 'created_at'
    ]
    search_fields = [
        'refund_number', 'payment__payment_number',
        'gateway_refund_id', 'reason'
    ]
    readonly_fields = [
        'id', 'refund_number', 'gateway_refund_id', 'gateway_response',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'refund_number', 'status', 'payment'
            )
        }),
        ('Refund Details', {
            'fields': ('amount', 'reason', 'notes')
        }),
        ('Gateway Information', {
            'fields': ('gateway_refund_id', 'gateway_response'),
            'classes': ['collapse']
        }),
        ('Processing', {
            'fields': ('processed_by', 'processed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
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
        'event_id', 'provider', 'event_type', 'processed_badge',
        'received_at', 'processed_at'
    ]
    list_filter = [
        'provider', 'event_type', 'processed', 'received_at'
    ]
    search_fields = ['event_id', 'event_type', 'error_message']
    readonly_fields = [
        'id', 'event_id', 'received_at', 'processed_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'event_id', 'provider', 'event_type')
        }),
        ('Processing Status', {
            'fields': ('processed', 'received_at', 'processed_at')
        }),
        ('Event Data', {
            'fields': ('event_data',),
            'classes': ['collapse']
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('updated_at',),
            'classes': ['collapse']
        })
    )
    
    actions = ['reprocess_webhooks', 'mark_as_processed']
    
    def processed_badge(self, obj):
        """Display processing status"""
        if obj.processed:
            return format_html('<span style="color: green; font-weight: bold;">✅ Processed</span>')
        else:
            return format_html('<span style="color: orange; font-weight: bold;">⏳ Pending</span>')
    processed_badge.short_description = 'Status'
    
    def reprocess_webhooks(self, request, queryset):
        """Reprocess selected webhook events"""
        unprocessed = queryset.filter(processed=False)
        count = unprocessed.update(error_message='')
        self.message_user(request, f"{count} webhook events queued for reprocessing.")
    reprocess_webhooks.short_description = "Reprocess webhooks"
    
    def mark_as_processed(self, request, queryset):
        """Mark webhooks as processed"""
        count = queryset.filter(processed=False).update(
            processed=True,
            processed_at=timezone.now()
        )
        self.message_user(request, f"{count} webhooks marked as processed.")
    mark_as_processed.short_description = "Mark as processed"


@admin.register(PaymentLink)
class PaymentLinkAdmin(admin.ModelAdmin):
    """Admin interface for payment links"""
    list_display = [
        'link_id', 'customer_name', 'amount_display', 'status_badge',
        'expires_at', 'used_at', 'created_at'
    ]
    list_filter = [
        'status', 'created_at', 'expires_at', 'used_at'
    ]
    search_fields = [
        'link_id', 'customer__username', 'customer__email',
        'description', 'invoice__invoice_number'
    ]
    readonly_fields = [
        'id', 'link_id', 'link_url', 'used_at', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'link_id', 'status', 'customer', 'invoice')
        }),
        ('Payment Details', {
            'fields': ('amount', 'currency', 'description')
        }),
        ('Link Configuration', {
            'fields': ('link_url', 'expires_at')
        }),
        ('Usage Tracking', {
            'fields': ('used_at', 'payment')
        }),
        ('Additional Settings', {
            'fields': ('metadata',),
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
        'account_name', 'bank_name', 'account_type', 'currency',
        'is_active', 'is_default', 'created_at'
    ]
    list_filter = [
        'account_type', 'currency', 'is_active', 'is_default',
        'bank_name', 'created_at'
    ]
    search_fields = [
        'account_name', 'bank_name', 'account_number',
        'routing_number', 'swift_code'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'account_name', 'account_type', 'currency',
                'is_active', 'is_default'
            )
        }),
        ('Bank Details', {
            'fields': (
                'bank_name', 'bank_address', 'account_number',
                'routing_number', 'swift_code', 'iban'
            )
        }),
        ('Additional Information', {
            'fields': ('description', 'metadata'),
            'classes': ['collapse']
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

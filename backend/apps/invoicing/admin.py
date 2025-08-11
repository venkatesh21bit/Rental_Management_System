from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Sum
from .models import (
    Invoice, InvoiceLine, InvoiceTemplate, 
    PaymentTerm, CreditNote, TaxRate
)


class InvoiceLineInline(admin.TabularInline):
    """Inline for invoice lines"""
    model = InvoiceLine
    extra = 1
    fields = ['description', 'product', 'quantity', 'unit_price', 'discount_percent', 'tax_rate', 'line_total']
    readonly_fields = ['line_total']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Admin interface for invoices"""
    list_display = [
        'invoice_number', 'customer_name', 'invoice_type', 'status_badge', 
        'total_amount', 'paid_amount', 'balance_due_display', 'due_date', 
        'overdue_indicator', 'created_at'
    ]
    list_filter = [
        'status', 'invoice_type', 'created_at', 'due_date', 
        'currency', 'order__status'
    ]
    search_fields = [
        'invoice_number', 'customer__username', 'customer__email',
        'billing_name', 'billing_email', 'order__order_number'
    ]
    readonly_fields = [
        'id', 'invoice_number', 'balance_due', 'is_overdue', 
        'days_overdue', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'invoice_number', 'invoice_type', 'status', 'order')
        }),
        ('Customer Details', {
            'fields': (
                'customer', 'billing_name', 'billing_email', 'billing_address'
            )
        }),
        ('Financial Details', {
            'fields': (
                'currency', 'subtotal', 'discount_amount', 'tax_amount', 
                'total_amount', 'paid_amount', 'balance_due'
            )
        }),
        ('Dates & Terms', {
            'fields': (
                'invoice_date', 'due_date', 'payment_terms', 
                'is_overdue', 'days_overdue'
            )
        }),
        ('Additional Information', {
            'fields': ('notes', 'internal_notes', 'tax_number'),
            'classes': ['collapse']
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    inlines = [InvoiceLineInline]
    
    actions = ['mark_as_paid', 'send_invoice', 'mark_as_overdue']
    
    def customer_name(self, obj):
        """Display customer name"""
        return obj.customer.get_full_name() or obj.customer.username
    customer_name.short_description = 'Customer'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'DRAFT': 'gray',
            'SENT': 'blue',
            'PAID': 'green',
            'PARTIAL': 'orange',
            'OVERDUE': 'red',
            'CANCELLED': 'dark',
            'REFUNDED': 'purple'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def balance_due_display(self, obj):
        """Display balance due with formatting"""
        balance = obj.balance_due
        if balance > 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">{} {:.2f}</span>',
                obj.currency, balance
            )
        return format_html('{} {:.2f}', obj.currency, balance)
    balance_due_display.short_description = 'Balance Due'
    
    def overdue_indicator(self, obj):
        """Show overdue indicator"""
        if obj.is_overdue:
            return format_html(
                '<span style="color: red; font-weight: bold;">🔴 {} days</span>',
                obj.days_overdue
            )
        return "✅"
    overdue_indicator.short_description = 'Overdue'
    
    def mark_as_paid(self, request, queryset):
        """Mark selected invoices as paid"""
        for invoice in queryset:
            invoice.mark_as_paid()
        self.message_user(request, f"{queryset.count()} invoices marked as paid.")
    mark_as_paid.short_description = "Mark selected invoices as paid"
    
    def send_invoice(self, request, queryset):
        """Send selected invoices to customers"""
        count = 0
        for invoice in queryset.filter(status='DRAFT'):
            invoice.status = 'SENT'
            invoice.save()
            count += 1
        self.message_user(request, f"{count} invoices sent to customers.")
    send_invoice.short_description = "Send selected invoices"
    
    def mark_as_overdue(self, request, queryset):
        """Mark selected invoices as overdue"""
        count = 0
        for invoice in queryset:
            if invoice.is_overdue and invoice.status not in ['PAID', 'CANCELLED']:
                invoice.status = 'OVERDUE'
                invoice.save()
                count += 1
        self.message_user(request, f"{count} invoices marked as overdue.")
    mark_as_overdue.short_description = "Mark overdue invoices"


@admin.register(InvoiceLine)
class InvoiceLineAdmin(admin.ModelAdmin):
    """Admin interface for invoice lines"""
    list_display = [
        'invoice_number', 'description', 'product_name', 'quantity', 
        'unit_price', 'discount_amount', 'line_total', 'created_at'
    ]
    list_filter = ['invoice__status', 'created_at', 'product']
    search_fields = [
        'description', 'invoice__invoice_number', 'product__name'
    ]
    
    def invoice_number(self, obj):
        return obj.invoice.invoice_number
    invoice_number.short_description = 'Invoice'
    
    def product_name(self, obj):
        return obj.product.name if obj.product else 'N/A'
    product_name.short_description = 'Product'


@admin.register(InvoiceTemplate)
class InvoiceTemplateAdmin(admin.ModelAdmin):
    """Admin interface for invoice templates"""
    list_display = [
        'name', 'invoice_type', 'default_payment_terms', 
        'default_tax_rate', 'is_active', 'created_at'
    ]
    list_filter = ['invoice_type', 'is_active', 'include_tax']
    search_fields = ['name', 'invoice_type']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'invoice_type', 'is_active')
        }),
        ('Content', {
            'fields': ('header_text', 'footer_text', 'terms_and_conditions')
        }),
        ('Default Settings', {
            'fields': (
                'default_payment_terms', 'default_due_days', 
                'include_tax', 'default_tax_rate'
            )
        })
    )


@admin.register(PaymentTerm)
class PaymentTermAdmin(admin.ModelAdmin):
    """Admin interface for payment terms"""
    list_display = [
        'name', 'due_days', 'early_payment_discount', 
        'late_fee_rate', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'due_days', 'is_active')
        }),
        ('Discount Terms', {
            'fields': ('early_payment_discount', 'early_payment_days')
        }),
        ('Late Fee Terms', {
            'fields': ('late_fee_rate', 'late_fee_grace_days')
        })
    )


@admin.register(CreditNote)
class CreditNoteAdmin(admin.ModelAdmin):
    """Admin interface for credit notes"""
    list_display = [
        'credit_note_number', 'customer_name', 'credit_type', 'status_badge',
        'credit_amount', 'applied_amount', 'remaining_credit_display', 
        'issue_date', 'created_at'
    ]
    list_filter = [
        'status', 'credit_type', 'issue_date', 'created_at', 'currency'
    ]
    search_fields = [
        'credit_note_number', 'customer__username', 'customer__email',
        'invoice__invoice_number', 'order__order_number'
    ]
    readonly_fields = [
        'id', 'credit_note_number', 'remaining_credit', 
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'credit_note_number', 'credit_type', 'status',
                'invoice', 'order', 'customer'
            )
        }),
        ('Financial Details', {
            'fields': (
                'currency', 'credit_amount', 'applied_amount', 'remaining_credit'
            )
        }),
        ('Details', {
            'fields': ('reason', 'notes', 'issue_date', 'expiry_date')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    def customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.username
    customer_name.short_description = 'Customer'
    
    def status_badge(self, obj):
        colors = {
            'DRAFT': 'gray',
            'ISSUED': 'blue',
            'APPLIED': 'green',
            'CANCELLED': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def remaining_credit_display(self, obj):
        amount = obj.remaining_credit
        if amount > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">{} {:.2f}</span>',
                obj.currency, amount
            )
        return format_html('{} {:.2f}', obj.currency, amount)
    remaining_credit_display.short_description = 'Remaining Credit'


@admin.register(TaxRate)
class TaxRateAdmin(admin.ModelAdmin):
    """Admin interface for tax rates"""
    list_display = [
        'name', 'rate_display', 'tax_type', 'country', 'state',
        'product_applicable', 'service_applicable', 'validity_period', 'is_active'
    ]
    list_filter = [
        'tax_type', 'is_active', 'country', 'state',
        'applicable_to_products', 'applicable_to_services'
    ]
    search_fields = ['name', 'description', 'country', 'state']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'rate', 'tax_type', 'is_active')
        }),
        ('Applicability', {
            'fields': ('applicable_to_products', 'applicable_to_services')
        }),
        ('Geographic Scope', {
            'fields': ('country', 'state')
        }),
        ('Validity Period', {
            'fields': ('effective_from', 'effective_to')
        })
    )
    
    def rate_display(self, obj):
        return f"{obj.rate}%"
    rate_display.short_description = 'Tax Rate'
    
    def product_applicable(self, obj):
        return "✅" if obj.applicable_to_products else "❌"
    product_applicable.short_description = 'Products'
    
    def service_applicable(self, obj):
        return "✅" if obj.applicable_to_services else "❌"
    service_applicable.short_description = 'Services'
    
    def validity_period(self, obj):
        start = obj.effective_from.strftime('%Y-%m-%d')
        end = obj.effective_to.strftime('%Y-%m-%d') if obj.effective_to else 'Ongoing'
        return f"{start} to {end}"
    validity_period.short_description = 'Valid Period'


# Admin site customizations
admin.site.site_header = "Rental Management System - Invoicing"
admin.site.site_title = "Invoicing Admin"
admin.site.index_title = "Invoice Management"

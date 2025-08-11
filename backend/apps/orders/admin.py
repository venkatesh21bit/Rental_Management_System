from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    RentalQuote, QuoteItem, RentalOrder, RentalItem, 
    Reservation, ReservationItem, RentalContract
)


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 0
    readonly_fields = ('line_total', 'created_at')
    fields = (
        'product', 'quantity', 'rental_unit', 'start_datetime', 'end_datetime',
        'unit_price', 'discount_percent', 'discount_amount', 'line_total', 'notes'
    )

@admin.register(RentalQuote)
class RentalQuoteAdmin(admin.ModelAdmin):
    list_display = (
        'quote_number', 'customer', 'status', 'total_amount', 
        'valid_until', 'created_by', 'created_at'
    )
    list_filter = ('status', 'created_at', 'valid_until')
    search_fields = ('quote_number', 'customer__username', 'customer__email')
    readonly_fields = ('quote_number', 'created_at', 'updated_at')
    inlines = [QuoteItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('quote_number', 'customer', 'created_by', 'status', 'valid_until')
        }),
        ('Pricing', {
            'fields': ('price_list', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount', 'currency')
        }),
        ('Additional Information', {
            'fields': ('notes', 'terms_conditions', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'created_by', 'price_list')


class RentalItemInline(admin.TabularInline):
    model = RentalItem
    extra = 0
    readonly_fields = ('line_total', 'created_at')
    fields = (
        'product', 'quantity', 'rental_unit', 'start_datetime', 'end_datetime',
        'unit_price', 'discount_percent', 'discount_amount', 'line_total', 'notes'
    )


@admin.register(RentalOrder)
class RentalOrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 'customer', 'status', 'rental_start', 'rental_end',
        'total_amount', 'is_overdue_display', 'created_at'
    )
    list_filter = ('status', 'created_at', 'rental_start', 'rental_end')
    search_fields = ('order_number', 'customer__username', 'customer__email')
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'rental_duration_days')
    inlines = [RentalItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('order_number', 'quote', 'customer', 'created_by', 'status')
        }),
        ('Rental Period', {
            'fields': (
                'rental_start', 'rental_end', 'rental_duration_days',
                'actual_pickup_at', 'actual_return_at'
            )
        }),
        ('Pricing', {
            'fields': (
                'price_list', 'subtotal', 'discount_amount', 'tax_amount',
                'deposit_amount', 'late_fee_amount', 'total_amount', 'currency'
            )
        }),
        ('Addresses', {
            'fields': ('pickup_address', 'return_address')
        }),
        ('Notes', {
            'fields': ('notes', 'internal_notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def is_overdue_display(self, obj):
        if obj.is_overdue:
            return format_html('<span style="color: red;">Overdue</span>')
        return format_html('<span style="color: green;">On Time</span>')
    is_overdue_display.short_description = 'Status'
    
    def rental_duration_days(self, obj):
        return f"{obj.rental_duration_days} days"
    rental_duration_days.short_description = 'Duration'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'created_by', 'quote', 'price_list')
    
    actions = ['mark_as_picked_up', 'mark_as_returned', 'calculate_late_fees']
    
    def mark_as_picked_up(self, request, queryset):
        count = 0
        for order in queryset:
            if order.status in ['CONFIRMED', 'RESERVED', 'PICKUP_SCHEDULED']:
                order.status = 'PICKED_UP'
                order.actual_pickup_at = timezone.now()
                order.save()
                count += 1
        self.message_user(request, f"{count} orders marked as picked up.")
    mark_as_picked_up.short_description = "Mark selected orders as picked up"
    
    def mark_as_returned(self, request, queryset):
        count = 0
        for order in queryset:
            if order.status in ['PICKED_UP', 'ACTIVE', 'RETURN_SCHEDULED']:
                order.status = 'RETURNED'
                order.actual_return_at = timezone.now()
                order.save()
                count += 1
        self.message_user(request, f"{count} orders marked as returned.")
    mark_as_returned.short_description = "Mark selected orders as returned"


class ReservationItemInline(admin.TabularInline):
    model = ReservationItem
    extra = 0
    readonly_fields = ('created_at',)
    fields = ('product', 'quantity', 'start_datetime', 'end_datetime', 'created_at')


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'order', 'status', 'return_due_at', 'pickup_scheduled_at',
        'actual_pickup_at', 'actual_return_at', 'reserved_at'
    )
    list_filter = ('status', 'reserved_at', 'return_due_at')
    search_fields = ('order__order_number', 'order__customer__username')
    readonly_fields = ('id', 'reserved_at', 'updated_at')
    inlines = [ReservationItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'order', 'status')
        }),
        ('Timing', {
            'fields': (
                'reserved_at', 'pickup_scheduled_at', 'actual_pickup_at',
                'return_due_at', 'actual_return_at', 'updated_at'
            )
        }),
        ('Location', {
            'fields': ('pickup_location', 'return_location')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'order__customer')


@admin.register(RentalContract)
class RentalContractAdmin(admin.ModelAdmin):
    list_display = (
        'contract_number', 'order', 'signed_at', 'created_at'
    )
    list_filter = ('signed_at', 'created_at')
    search_fields = ('contract_number', 'order__order_number', 'order__customer__username')
    readonly_fields = ('contract_number', 'created_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('contract_number', 'order', 'signed_at', 'created_at')
        }),
        ('Contract Content', {
            'fields': ('terms_and_conditions', 'contract_file')
        }),
        ('Signatures', {
            'fields': ('customer_signature', 'staff_signature'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'order__customer')


@admin.register(QuoteItem)
class QuoteItemAdmin(admin.ModelAdmin):
    list_display = (
        'quote', 'product', 'quantity', 'rental_unit', 
        'start_datetime', 'end_datetime', 'line_total'
    )
    list_filter = ('rental_unit', 'start_datetime', 'end_datetime')
    search_fields = ('quote__quote_number', 'product__name', 'product__sku')
    readonly_fields = ('line_total', 'created_at')


@admin.register(RentalItem)
class RentalItemAdmin(admin.ModelAdmin):
    list_display = (
        'order', 'product', 'quantity', 'rental_unit',
        'start_datetime', 'end_datetime', 'line_total'
    )
    list_filter = ('rental_unit', 'start_datetime', 'end_datetime')
    search_fields = ('order__order_number', 'product__name', 'product__sku')
    readonly_fields = ('line_total', 'created_at')


@admin.register(ReservationItem)
class ReservationItemAdmin(admin.ModelAdmin):
    list_display = (
        'reservation', 'product', 'quantity', 'start_datetime', 'end_datetime'
    )
    list_filter = ('start_datetime', 'end_datetime')
    search_fields = ('reservation__order__order_number', 'product__name')
    readonly_fields = ('created_at',)

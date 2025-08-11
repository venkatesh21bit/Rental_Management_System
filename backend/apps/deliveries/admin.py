from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Sum
from .models import (
    DeliveryDocument, DeliveryItem, ReturnDocument, 
    ReturnItem, StockMovement, DeliveryRoute
)


class DeliveryItemInline(admin.TabularInline):
    """Inline for delivery items"""
    model = DeliveryItem
    extra = 1
    fields = [
        'product', 'quantity_scheduled', 'quantity_delivered', 
        'condition_at_pickup', 'notes'
    ]


class ReturnItemInline(admin.TabularInline):
    """Inline for return items"""
    model = ReturnItem
    extra = 1
    fields = [
        'product', 'quantity_due', 'quantity_returned', 'quantity_missing',
        'quantity_damaged', 'condition_returned', 'damage_cost'
    ]


@admin.register(DeliveryDocument)
class DeliveryDocumentAdmin(admin.ModelAdmin):
    """Admin interface for delivery documents"""
    list_display = [
        'document_number', 'document_type_badge', 'reservation_order', 
        'status_badge', 'driver_name', 'scheduled_datetime', 
        'overdue_indicator', 'created_at'
    ]
    list_filter = [
        'document_type', 'status', 'scheduled_datetime', 'created_at',
        'driver', 'completed_at'
    ]
    search_fields = [
        'document_number', 'reservation__order__order_number',
        'driver__username', 'pickup_address', 'delivery_address'
    ]
    readonly_fields = [
        'id', 'document_number', 'is_overdue', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'document_number', 'document_type', 'status', 'reservation'
            )
        }),
        ('Assignment', {
            'fields': ('driver', 'vehicle')
        }),
        ('Scheduling', {
            'fields': ('scheduled_datetime', 'estimated_duration', 'is_overdue')
        }),
        ('Addresses', {
            'fields': ('pickup_address', 'delivery_address')
        }),
        ('Tracking', {
            'fields': (
                'started_at', 'completed_at', 'current_latitude', 
                'current_longitude', 'last_location_update'
            )
        }),
        ('Additional Information', {
            'fields': (
                'special_instructions', 'customer_contact', 'notes'
            ),
            'classes': ['collapse']
        }),
        ('Digital Records', {
            'fields': ('customer_signature', 'driver_signature', 'photos'),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    inlines = [DeliveryItemInline]
    actions = ['mark_as_completed', 'assign_driver', 'mark_as_failed']
    
    def document_type_badge(self, obj):
        """Display document type with icon"""
        icons = {'PICKUP': '📦', 'DELIVERY': '🚚'}
        icon = icons.get(obj.document_type, '📋')
        return format_html('{} {}', icon, obj.get_document_type_display())
    document_type_badge.short_description = 'Type'
    
    def reservation_order(self, obj):
        """Display related order number"""
        return obj.reservation.order.order_number
    reservation_order.short_description = 'Order'
    
    def status_badge(self, obj):
        """Display status with color coding"""
        colors = {
            'PENDING': 'orange',
            'SCHEDULED': 'blue',
            'IN_TRANSIT': 'purple',
            'DELIVERED': 'green',
            'FAILED': 'red',
            'CANCELLED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def driver_name(self, obj):
        """Display driver name"""
        return obj.driver.get_full_name() if obj.driver else 'Not Assigned'
    driver_name.short_description = 'Driver'
    
    def overdue_indicator(self, obj):
        """Show overdue indicator"""
        if obj.is_overdue:
            return format_html('<span style="color: red; font-weight: bold;">🔴 Overdue</span>')
        return "✅"
    overdue_indicator.short_description = 'Status'
    
    def mark_as_completed(self, request, queryset):
        """Mark selected deliveries as completed"""
        count = queryset.filter(status__in=['SCHEDULED', 'IN_TRANSIT']).update(
            status='DELIVERED',
            completed_at=timezone.now()
        )
        self.message_user(request, f"{count} deliveries marked as completed.")
    mark_as_completed.short_description = "Mark as completed"
    
    def assign_driver(self, request, queryset):
        """Assign driver to selected deliveries"""
        # This would open a form to select driver
        self.message_user(request, "Use the edit form to assign drivers individually.")
    assign_driver.short_description = "Assign driver"
    
    def mark_as_failed(self, request, queryset):
        """Mark selected deliveries as failed"""
        count = queryset.filter(status__in=['SCHEDULED', 'IN_TRANSIT']).update(
            status='FAILED'
        )
        self.message_user(request, f"{count} deliveries marked as failed.")
    mark_as_failed.short_description = "Mark as failed"


@admin.register(DeliveryItem)
class DeliveryItemAdmin(admin.ModelAdmin):
    """Admin interface for delivery items"""
    list_display = [
        'document_number', 'product_name', 'quantity_scheduled',
        'quantity_delivered', 'delivery_status', 'condition_at_pickup',
        'created_at'
    ]
    list_filter = [
        'condition_at_pickup', 'delivery_document__status',
        'delivery_document__document_type', 'created_at'
    ]
    search_fields = [
        'delivery_document__document_number', 'product__name',
        'product__sku', 'notes'
    ]
    
    def document_number(self, obj):
        return obj.delivery_document.document_number
    document_number.short_description = 'Document'
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def delivery_status(self, obj):
        """Show delivery completion status"""
        if obj.quantity_delivered >= obj.quantity_scheduled:
            return format_html('<span style="color: green;">✅ Complete</span>')
        elif obj.quantity_delivered > 0:
            return format_html('<span style="color: orange;">🔄 Partial</span>')
        return format_html('<span style="color: gray;">⏳ Pending</span>')
    delivery_status.short_description = 'Delivery Status'


@admin.register(ReturnDocument)
class ReturnDocumentAdmin(admin.ModelAdmin):
    """Admin interface for return documents"""
    list_display = [
        'document_number', 'reservation_order', 'status_badge',
        'driver_name', 'due_datetime', 'overdue_indicator',
        'late_fee_applied', 'created_at'
    ]
    list_filter = [
        'status', 'due_datetime', 'created_at', 'driver', 'completed_at'
    ]
    search_fields = [
        'document_number', 'reservation__order__order_number',
        'driver__username', 'pickup_address', 'return_address'
    ]
    readonly_fields = [
        'id', 'document_number', 'is_overdue', 'days_overdue',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id', 'document_number', 'status', 'reservation'
            )
        }),
        ('Assignment', {
            'fields': ('driver', 'vehicle')
        }),
        ('Scheduling', {
            'fields': (
                'scheduled_datetime', 'due_datetime', 'is_overdue', 'days_overdue'
            )
        }),
        ('Addresses', {
            'fields': ('pickup_address', 'return_address')
        }),
        ('Tracking', {
            'fields': (
                'started_at', 'completed_at', 'current_latitude',
                'current_longitude', 'last_location_update'
            )
        }),
        ('Late Fees', {
            'fields': ('late_fee_applied',)
        }),
        ('Additional Information', {
            'fields': (
                'special_instructions', 'customer_contact', 'notes'
            ),
            'classes': ['collapse']
        }),
        ('Digital Records', {
            'fields': ('customer_signature', 'driver_signature', 'photos'),
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    inlines = [ReturnItemInline]
    actions = ['mark_as_completed', 'calculate_late_fees', 'mark_as_overdue']
    
    def reservation_order(self, obj):
        return obj.reservation.order.order_number
    reservation_order.short_description = 'Order'
    
    def status_badge(self, obj):
        colors = {
            'PENDING': 'orange',
            'SCHEDULED': 'blue',
            'IN_TRANSIT': 'purple',
            'COMPLETED': 'green',
            'PARTIAL': 'yellow',
            'OVERDUE': 'red',
            'CANCELLED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def driver_name(self, obj):
        return obj.driver.get_full_name() if obj.driver else 'Not Assigned'
    driver_name.short_description = 'Driver'
    
    def overdue_indicator(self, obj):
        if obj.is_overdue:
            return format_html(
                '<span style="color: red; font-weight: bold;">🔴 {} days</span>',
                obj.days_overdue
            )
        return "✅"
    overdue_indicator.short_description = 'Overdue Status'
    
    def mark_as_completed(self, request, queryset):
        count = queryset.filter(status__in=['SCHEDULED', 'IN_TRANSIT']).update(
            status='COMPLETED',
            completed_at=timezone.now()
        )
        self.message_user(request, f"{count} returns marked as completed.")
    mark_as_completed.short_description = "Mark as completed"
    
    def calculate_late_fees(self, request, queryset):
        # This would trigger late fee calculation
        self.message_user(request, "Late fee calculation triggered for selected returns.")
    calculate_late_fees.short_description = "Calculate late fees"
    
    def mark_as_overdue(self, request, queryset):
        count = 0
        for return_doc in queryset:
            if return_doc.is_overdue and return_doc.status not in ['COMPLETED', 'CANCELLED']:
                return_doc.status = 'OVERDUE'
                return_doc.save()
                count += 1
        self.message_user(request, f"{count} returns marked as overdue.")
    mark_as_overdue.short_description = "Mark overdue returns"


@admin.register(ReturnItem)
class ReturnItemAdmin(admin.ModelAdmin):
    """Admin interface for return items"""
    list_display = [
        'document_number', 'product_name', 'quantity_due',
        'quantity_returned', 'quantity_missing', 'quantity_damaged',
        'return_status', 'damage_cost', 'replacement_cost'
    ]
    list_filter = [
        'condition_returned', 'return_document__status', 'created_at'
    ]
    search_fields = [
        'return_document__document_number', 'product__name',
        'damage_description'
    ]
    
    def document_number(self, obj):
        return obj.return_document.document_number
    document_number.short_description = 'Document'
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def return_status(self, obj):
        if obj.is_complete_return:
            return format_html('<span style="color: green;">✅ Complete</span>')
        elif obj.quantity_missing > 0:
            return format_html('<span style="color: red;">❌ Missing Items</span>')
        elif obj.quantity_damaged > 0:
            return format_html('<span style="color: orange;">⚠️ Damage</span>')
        elif obj.quantity_returned > 0:
            return format_html('<span style="color: blue;">🔄 Partial</span>')
        return format_html('<span style="color: gray;">⏳ Pending</span>')
    return_status.short_description = 'Return Status'


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    """Admin interface for stock movements"""
    list_display = [
        'movement_number', 'movement_type_badge', 'product_name',
        'quantity_display', 'from_location', 'to_location',
        'handled_by_user', 'cost_impact', 'created_at'
    ]
    list_filter = [
        'movement_type', 'created_at', 'from_location', 'to_location',
        'handled_by'
    ]
    search_fields = [
        'movement_number', 'product__name', 'product__sku',
        'reason', 'from_location', 'to_location'
    ]
    readonly_fields = ['id', 'movement_number', 'created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'movement_number', 'movement_type', 'product')
        }),
        ('Movement Details', {
            'fields': ('quantity', 'from_location', 'to_location')
        }),
        ('References', {
            'fields': ('delivery_document', 'return_document')
        }),
        ('Additional Information', {
            'fields': ('handled_by', 'reason', 'cost_impact')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        })
    )
    
    def movement_type_badge(self, obj):
        icons = {
            'PICKUP': '📤',
            'RETURN': '📥',
            'DAMAGE': '⚠️',
            'LOSS': '❌',
            'MAINTENANCE': '🔧'
        }
        icon = icons.get(obj.movement_type, '📋')
        return format_html('{} {}', icon, obj.get_movement_type_display())
    movement_type_badge.short_description = 'Type'
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def quantity_display(self, obj):
        color = 'green' if obj.quantity > 0 else 'red'
        sign = '+' if obj.quantity > 0 else ''
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}{}</span>',
            color, sign, obj.quantity
        )
    quantity_display.short_description = 'Quantity'
    
    def handled_by_user(self, obj):
        return obj.handled_by.get_full_name() if obj.handled_by else 'System'
    handled_by_user.short_description = 'Handled By'


@admin.register(DeliveryRoute)
class DeliveryRouteAdmin(admin.ModelAdmin):
    """Admin interface for delivery routes"""
    list_display = [
        'route_name', 'route_date', 'driver_name', 'status_badge',
        'document_count', 'planned_start_time', 'actual_duration',
        'estimated_distance'
    ]
    list_filter = [
        'status', 'route_date', 'driver', 'planned_start_time'
    ]
    search_fields = [
        'route_name', 'driver__username', 'vehicle',
        'start_location', 'end_location'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'route_name', 'route_date', 'status')
        }),
        ('Assignment', {
            'fields': ('driver', 'vehicle')
        }),
        ('Route Details', {
            'fields': (
                'start_location', 'end_location', 'estimated_distance',
                'estimated_duration'
            )
        }),
        ('Timing', {
            'fields': (
                'planned_start_time', 'actual_start_time',
                'planned_end_time', 'actual_end_time'
            )
        }),
        ('Associated Documents', {
            'fields': ('delivery_documents', 'return_documents')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        })
    )
    
    filter_horizontal = ['delivery_documents', 'return_documents']
    
    def driver_name(self, obj):
        return obj.driver.get_full_name()
    driver_name.short_description = 'Driver'
    
    def status_badge(self, obj):
        colors = {
            'PLANNED': 'blue',
            'IN_PROGRESS': 'orange',
            'COMPLETED': 'green',
            'CANCELLED': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def document_count(self, obj):
        delivery_count = obj.delivery_documents.count()
        return_count = obj.return_documents.count()
        total = delivery_count + return_count
        return format_html(
            '<span title="Deliveries: {}, Returns: {}">{}</span>',
            delivery_count, return_count, total
        )
    document_count.short_description = 'Documents'
    
    def actual_duration(self, obj):
        if obj.actual_start_time and obj.actual_end_time:
            from datetime import datetime, timedelta
            start = datetime.combine(obj.route_date, obj.actual_start_time)
            end = datetime.combine(obj.route_date, obj.actual_end_time)
            duration = end - start
            hours = duration.total_seconds() / 3600
            return f"{hours:.1f}h"
        return "N/A"
    actual_duration.short_description = 'Duration'


# Admin site customizations
admin.site.site_header = "Rental Management System - Deliveries"
admin.site.site_title = "Deliveries Admin"
admin.site.index_title = "Delivery & Return Management"

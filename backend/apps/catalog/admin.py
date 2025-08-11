from django.contrib import admin
from .models import ProductCategory, Product, ProductImage, ProductItem


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary', 'sort_order')


class ProductItemInline(admin.TabularInline):
    model = ProductItem
    extra = 0
    fields = ('serial_number', 'status', 'condition_rating', 'location')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'is_active', 'created_at')
    list_filter = ('is_active', 'parent', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'name': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'sku', 'name', 'category', 'rentable', 'tracking', 
        'quantity_on_hand', 'available_quantity', 'is_active'
    )
    list_filter = (
        'rentable', 'tracking', 'default_rental_unit', 
        'category', 'is_active', 'created_at'
    )
    search_fields = ('sku', 'name', 'description', 'brand', 'model')
    readonly_fields = ('available_quantity', 'created_at', 'updated_at')
    inlines = [ProductImageInline, ProductItemInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('sku', 'name', 'description', 'category')
        }),
        ('Rental Configuration', {
            'fields': (
                'rentable', 'tracking', 'default_rental_unit',
                'min_rental_duration', 'max_rental_duration'
            )
        }),
        ('Stock Information', {
            'fields': (
                'quantity_on_hand', 'quantity_reserved', 
                'quantity_rented', 'available_quantity'
            )
        }),
        ('Physical Properties', {
            'fields': ('weight', 'dimensions', 'brand', 'model', 'year'),
            'classes': ('collapse',)
        }),
        ('Status & Timestamps', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ProductItem)
class ProductItemAdmin(admin.ModelAdmin):
    list_display = (
        'serial_number', 'product', 'status', 
        'condition_rating', 'location', 'updated_at'
    )
    list_filter = (
        'status', 'condition_rating', 'product__category', 
        'last_service_date', 'created_at'
    )
    search_fields = (
        'serial_number', 'internal_code', 'product__sku', 
        'product__name', 'location'
    )
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('product',)

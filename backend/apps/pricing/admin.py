from django.contrib import admin
from .models import PriceList, PriceRule, LateFeeRule


class PriceRuleInline(admin.TabularInline):
    model = PriceRule
    extra = 1
    fields = (
        'product', 'category', 'rate_hour', 'rate_day', 
        'rate_week', 'rate_month', 'discount_type', 'discount_value', 'is_active'
    )


@admin.register(PriceList)
class PriceListAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'currency', 'customer_group', 'is_default', 
        'is_active', 'valid_from', 'valid_to', 'priority'
    )
    list_filter = ('is_default', 'is_active', 'currency', 'customer_group', 'created_at')
    search_fields = ('name', 'description')
    inlines = [PriceRuleInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'currency')
        }),
        ('Scope & Priority', {
            'fields': ('customer_group', 'is_default', 'priority')
        }),
        ('Validity Period', {
            'fields': ('valid_from', 'valid_to', 'is_active')
        })
    )


@admin.register(PriceRule)
class PriceRuleAdmin(admin.ModelAdmin):
    list_display = (
        'price_list', 'product', 'category', 'rate_day', 
        'discount_type', 'discount_value', 'is_active'
    )
    list_filter = (
        'price_list', 'discount_type', 'is_active', 
        'product__category', 'created_at'
    )
    search_fields = ('price_list__name', 'product__name', 'category__name')
    raw_id_fields = ('product',)
    fieldsets = (
        ('Scope', {
            'fields': ('price_list', 'product', 'category')
        }),
        ('Rates', {
            'fields': ('rate_hour', 'rate_day', 'rate_week', 'rate_month')
        }),
        ('Discounts', {
            'fields': ('discount_type', 'discount_value')
        }),
        ('Requirements', {
            'fields': ('min_duration_hours', 'min_quantity')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_to', 'is_active')
        })
    )


@admin.register(LateFeeRule)
class LateFeeRuleAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'product', 'category', 'fee_type', 
        'fee_value', 'grace_period_hours', 'is_active', 'priority'
    )
    list_filter = ('fee_type', 'is_active', 'product__category', 'created_at')
    search_fields = ('name', 'description', 'product__name', 'category__name')
    raw_id_fields = ('product',)
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'priority')
        }),
        ('Scope', {
            'fields': ('product', 'category')
        }),
        ('Fee Configuration', {
            'fields': ('fee_type', 'fee_value', 'grace_period_hours')
        }),
        ('Limits', {
            'fields': ('max_fee_amount', 'max_fee_days')
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )

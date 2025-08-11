from django.contrib import admin
from .models import CustomerGroup, UserProfile


@admin.register(CustomerGroup)
class CustomerGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_percent', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'customer_group', 'is_verified', 'is_active', 'created_at')
    list_filter = ('role', 'customer_group', 'is_verified', 'is_active', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'phone')
    raw_id_fields = ('user',)

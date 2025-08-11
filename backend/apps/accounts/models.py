from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class CustomerGroup(models.Model):
    """Customer groups for pricing and access control"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    discount_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Default discount percentage for this group"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_groups'
        verbose_name = 'Customer Group'
        verbose_name_plural = 'Customer Groups'

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    """Extended user profile for rental management"""
    
    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        END_USER = "END_USER", "End User"  # Internal staff
        STAFF = "STAFF", "Staff"
        ADMIN = "ADMIN", "Admin"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    customer_group = models.ForeignKey(
        CustomerGroup, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    
    # Contact Information
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='India')
    
    # Business Information
    company_name = models.CharField(max_length=200, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    
    # Preferences
    preferred_currency = models.CharField(max_length=3, default='INR')
    notification_email = models.BooleanField(default=True)
    notification_sms = models.BooleanField(default=False)
    
    # Account Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()

    @property
    def display_name(self):
        return self.full_name or self.user.username

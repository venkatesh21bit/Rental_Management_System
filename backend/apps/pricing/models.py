from django.db import models
from django.utils import timezone
from apps.accounts.models import CustomerGroup
from apps.catalog.models import Product, ProductCategory


class PriceList(models.Model):
    """Price lists for different customer segments and time periods"""
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    currency = models.CharField(max_length=3, default="INR")
    
    # Scope
    customer_group = models.ForeignKey(
        CustomerGroup, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='price_lists'
    )
    is_default = models.BooleanField(default=False)
    
    # Validity
    valid_from = models.DateField(null=True, blank=True)
    valid_to = models.DateField(null=True, blank=True)
    
    # Priority (higher number = higher priority)
    priority = models.PositiveIntegerField(default=10)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'price_lists'
        verbose_name = 'Price List'
        verbose_name_plural = 'Price Lists'
        ordering = ['-priority', 'name']

    def __str__(self):
        return self.name

    def is_valid_now(self):
        """Check if price list is valid for current date"""
        now = timezone.now().date()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_to and now > self.valid_to:
            return False
        return self.is_active


class PriceRule(models.Model):
    """Pricing rules within a price list"""
    
    class DiscountType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", "Percentage Discount"
        FIXED = "FIXED", "Fixed Amount Discount"

    price_list = models.ForeignKey(PriceList, on_delete=models.CASCADE, related_name='rules')
    
    # Scope - either product or category
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='price_rules'
    )
    category = models.ForeignKey(
        ProductCategory, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='price_rules'
    )
    
    # Validity
    valid_from = models.DateField(null=True, blank=True)
    valid_to = models.DateField(null=True, blank=True)
    
    # Time-dependent base rates
    rate_hour = models.DecimalField(
        max_digits=10, decimal_places=2, 
        null=True, blank=True,
        help_text="Price per hour"
    )
    rate_day = models.DecimalField(
        max_digits=10, decimal_places=2, 
        null=True, blank=True,
        help_text="Price per day"
    )
    rate_week = models.DecimalField(
        max_digits=10, decimal_places=2, 
        null=True, blank=True,
        help_text="Price per week"
    )
    rate_month = models.DecimalField(
        max_digits=10, decimal_places=2, 
        null=True, blank=True,
        help_text="Price per month"
    )
    
    # Discounts
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
        null=True,
        blank=True
    )
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=2, 
        null=True, blank=True,
        help_text="Percentage (0-100) or fixed amount"
    )
    
    # Minimum requirements
    min_duration_hours = models.PositiveIntegerField(
        default=0,
        help_text="Minimum rental duration in hours for this rule to apply"
    )
    min_quantity = models.PositiveIntegerField(
        default=1,
        help_text="Minimum quantity for this rule to apply"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'price_rules'
        verbose_name = 'Price Rule'
        verbose_name_plural = 'Price Rules'
        ordering = ['-min_duration_hours', '-min_quantity']
        indexes = [
            models.Index(fields=['product', 'is_active']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['price_list', 'is_active']),
        ]

    def __str__(self):
        scope = self.product.name if self.product else self.category.name if self.category else "All"
        return f"{self.price_list.name} - {scope}"

    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Either product or category must be specified, but not both
        if self.product and self.category:
            raise ValidationError("Cannot specify both product and category")
        if not self.product and not self.category:
            raise ValidationError("Must specify either product or category")
        
        # At least one rate must be specified
        if not any([self.rate_hour, self.rate_day, self.rate_week, self.rate_month]):
            raise ValidationError("At least one rate must be specified")

    def is_valid_now(self):
        """Check if price rule is valid for current date"""
        now = timezone.now().date()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_to and now > self.valid_to:
            return False
        return self.is_active


class LateFeeRule(models.Model):
    """Rules for calculating late return fees"""
    
    class FeeType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", "Percentage of Rental Amount"
        FIXED_PER_DAY = "FIXED_PER_DAY", "Fixed Amount Per Day"
        FIXED_PER_HOUR = "FIXED_PER_HOUR", "Fixed Amount Per Hour"

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Scope - either product, category, or global
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='late_fee_rules'
    )
    category = models.ForeignKey(
        ProductCategory, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='late_fee_rules'
    )
    
    # Fee Configuration
    fee_type = models.CharField(max_length=20, choices=FeeType.choices)
    fee_value = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Percentage (0-100) or fixed amount based on fee type"
    )
    
    # Grace Period
    grace_period_hours = models.PositiveIntegerField(
        default=0,
        help_text="Grace period in hours before late fees apply"
    )
    
    # Caps
    max_fee_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        help_text="Maximum late fee amount (optional)"
    )
    max_fee_days = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Maximum days to charge late fees (optional)"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'late_fee_rules'
        verbose_name = 'Late Fee Rule'
        verbose_name_plural = 'Late Fee Rules'
        ordering = ['-priority', 'name']

    def __str__(self):
        scope = self.product.name if self.product else self.category.name if self.category else "Global"
        return f"{self.name} - {scope}"

    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Cannot specify both product and category
        if self.product and self.category:
            raise ValidationError("Cannot specify both product and category")

from django.db import models
import uuid


class ProductCategory(models.Model):
    """Product categories for organizing rental items"""
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='children'
    )
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_categories'
        verbose_name = 'Product Category'
        verbose_name_plural = 'Product Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def full_path(self):
        """Return full category path"""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name


class Product(models.Model):
    """Products available for rental"""
    
    class Tracking(models.TextChoices):
        SERIAL = "SERIAL", "Serial Number Tracking"
        QUANTITY = "QUANTITY", "Quantity Only"

    class RentalUnit(models.TextChoices):
        HOUR = "HOUR", "Per Hour"
        DAY = "DAY", "Per Day"
        WEEK = "WEEK", "Per Week"
        MONTH = "MONTH", "Per Month"

    # Basic Information
    sku = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        ProductCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='products'
    )
    
    # Rental Configuration
    rentable = models.BooleanField(default=True)
    tracking = models.CharField(
        max_length=16, 
        choices=Tracking.choices, 
        default=Tracking.QUANTITY
    )
    default_rental_unit = models.CharField(
        max_length=10,
        choices=RentalUnit.choices,
        default=RentalUnit.DAY
    )
    min_rental_duration = models.PositiveIntegerField(
        default=1,
        help_text="Minimum rental duration in the default unit"
    )
    max_rental_duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum rental duration in the default unit"
    )
    
    # Stock Information
    quantity_on_hand = models.PositiveIntegerField(default=0)
    quantity_reserved = models.PositiveIntegerField(default=0)
    quantity_rented = models.PositiveIntegerField(default=0)
    
    # Physical Properties
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions = models.CharField(max_length=100, blank=True, help_text="L x W x H")
    
    # Pricing - Simple daily rate for easy API access
    daily_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Default daily rental rate (can be overridden by pricing rules)"
    )
    
    # Additional Information
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    condition_notes = models.TextField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['name']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['rentable', 'is_active']),
        ]

    def __str__(self):
        return f"{self.sku} - {self.name}"

    @property
    def available_quantity(self):
        """Calculate available quantity for rental"""
        return self.quantity_on_hand - self.quantity_reserved - self.quantity_rented

    @property
    def is_available(self):
        """Check if product is available for rental"""
        return self.is_active and self.rentable and self.available_quantity > 0


class ProductImage(models.Model):
    """Product images"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"Image for {self.product.name}"


class ProductItem(models.Model):
    """Individual product items with serial tracking"""
    
    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        RESERVED = "RESERVED", "Reserved"
        RENTED = "RENTED", "Rented"
        MAINTENANCE = "MAINTENANCE", "Under Maintenance"
        DAMAGED = "DAMAGED", "Damaged"
        RETIRED = "RETIRED", "Retired"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='items')
    serial_number = models.CharField(max_length=120, unique=True)
    internal_code = models.CharField(max_length=50, blank=True)
    
    # Status and Condition
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.AVAILABLE
    )
    condition_rating = models.PositiveIntegerField(
        default=10,
        help_text="Condition rating from 1-10 (10 being excellent)"
    )
    condition_notes = models.TextField(blank=True)
    
    # Location and Tracking
    location = models.CharField(max_length=100, blank=True)
    last_service_date = models.DateField(null=True, blank=True)
    next_service_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_items'
        verbose_name = 'Product Item'
        verbose_name_plural = 'Product Items'
        ordering = ['serial_number']
        indexes = [
            models.Index(fields=['product', 'status']),
            models.Index(fields=['serial_number']),
        ]

    def __str__(self):
        return f"{self.product.sku}:{self.serial_number}"

    @property
    def is_available_for_rental(self):
        """Check if this specific item is available for rental"""
        return self.status == self.Status.AVAILABLE and self.condition_rating >= 6

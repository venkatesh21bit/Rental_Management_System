from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from apps.catalog.models import Product, ProductCategory
from apps.pricing.models import PriceList
from apps.accounts.models import UserProfile

User = get_user_model()


class RentalQuote(models.Model):
    """Rental quotations before conversion to orders"""
    
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SENT = "SENT", "Sent to Customer"
        CONFIRMED = "CONFIRMED", "Confirmed by Customer"
        EXPIRED = "EXPIRED", "Expired"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quote_number = models.CharField(max_length=64, unique=True)
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='rental_quotes')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_quotes')
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    valid_until = models.DateTimeField(null=True, blank=True)
    
    # Pricing
    price_list = models.ForeignKey(PriceList, on_delete=models.SET_NULL, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    
    # Additional Info
    notes = models.TextField(blank=True)
    terms_conditions = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rental_quotes'
        verbose_name = 'Rental Quote'
        verbose_name_plural = 'Rental Quotes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['quote_number']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Quote {self.quote_number} - {self.customer.username}"

    def save(self, *args, **kwargs):
        if not self.quote_number:
            self.quote_number = self.generate_quote_number()
        super().save(*args, **kwargs)

    def generate_quote_number(self):
        """Generate unique quote number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        count = RentalQuote.objects.filter(
            created_at__date=timezone.now().date()
        ).count() + 1
        return f"Q-{timestamp}-{count:04d}"


class RentalOrder(models.Model):
    """Rental orders - confirmed quotations"""
    
    class Status(models.TextChoices):
        CONFIRMED = "CONFIRMED", "Confirmed"
        RESERVED = "RESERVED", "Items Reserved"
        PICKUP_SCHEDULED = "PICKUP_SCHEDULED", "Pickup Scheduled"
        PICKED_UP = "PICKED_UP", "Items Picked Up"
        ACTIVE = "ACTIVE", "Rental Active"
        RETURN_SCHEDULED = "RETURN_SCHEDULED", "Return Scheduled"
        RETURNED = "RETURNED", "Items Returned"
        COMPLETED = "COMPLETED", "Order Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=64, unique=True)
    quote = models.ForeignKey(RentalQuote, on_delete=models.SET_NULL, null=True, blank=True)
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='rental_orders')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_orders')
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED)
    
    # Rental Period
    rental_start = models.DateTimeField()
    rental_end = models.DateTimeField()
    actual_pickup_at = models.DateTimeField(null=True, blank=True)
    actual_return_at = models.DateTimeField(null=True, blank=True)
    
    # Pricing
    price_list = models.ForeignKey(PriceList, on_delete=models.SET_NULL, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    late_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    
    # Additional Info
    pickup_address = models.TextField(blank=True)
    return_address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rental_orders'
        verbose_name = 'Rental Order'
        verbose_name_plural = 'Rental Orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['order_number']),
            models.Index(fields=['status', 'rental_start']),
            models.Index(fields=['rental_start', 'rental_end']),
        ]

    def __str__(self):
        return f"Order {self.order_number} - {self.customer.username}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        super().save(*args, **kwargs)

    def generate_order_number(self):
        """Generate unique order number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        count = RentalOrder.objects.filter(
            created_at__date=timezone.now().date()
        ).count() + 1
        return f"RO-{timestamp}-{count:04d}"

    @property
    def rental_duration_days(self):
        """Calculate rental duration in days"""
        delta = self.rental_end - self.rental_start
        return delta.days + (1 if delta.seconds > 0 else 0)

    @property
    def is_overdue(self):
        """Check if rental is overdue"""
        if self.status in [self.Status.COMPLETED, self.Status.CANCELLED]:
            return False
        return timezone.now() > self.rental_end


class QuoteItem(models.Model):
    """Items in a rental quote"""
    quote = models.ForeignKey(RentalQuote, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    rental_unit = models.CharField(max_length=10, default='DAY')  # HOUR, DAY, WEEK, MONTH
    
    # Pricing
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Rental details
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quote_items'
        verbose_name = 'Quote Item'
        verbose_name_plural = 'Quote Items'
        indexes = [
            models.Index(fields=['quote', 'product']),
            models.Index(fields=['product', 'start_datetime', 'end_datetime']),
        ]

    def __str__(self):
        return f"{self.product.name} x{self.quantity} - {self.quote.quote_number}"

    def save(self, *args, **kwargs):
        """Auto-calculate line_total if not provided"""
        if not self.line_total:
            self.calculate_line_total()
        super().save(*args, **kwargs)

    def calculate_line_total(self):
        """Calculate line total based on unit price and quantity"""
        if self.unit_price and self.quantity:
            subtotal = self.unit_price * self.quantity
            self.line_total = subtotal - self.discount_amount
        else:
            self.line_total = 0


class RentalItem(models.Model):
    """Items in a rental order"""
    order = models.ForeignKey(RentalOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    rental_unit = models.CharField(max_length=10, default='DAY')
    
    # Pricing
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Rental details
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rental_items'
        verbose_name = 'Rental Item'
        verbose_name_plural = 'Rental Items'
        indexes = [
            models.Index(fields=['order', 'product']),
            models.Index(fields=['product', 'start_datetime', 'end_datetime']),
        ]

    def __str__(self):
        return f"{self.product.name} x{self.quantity} - {self.order.order_number}"

    def save(self, *args, **kwargs):
        """Auto-calculate line_total if not provided"""
        if not self.line_total:
            self.calculate_line_total()
        super().save(*args, **kwargs)

    def calculate_line_total(self):
        """Calculate line total based on unit price and quantity"""
        if self.unit_price and self.quantity:
            subtotal = self.unit_price * self.quantity
            self.line_total = subtotal - self.discount_amount
        else:
            self.line_total = 0


class Reservation(models.Model):
    """Inventory reservations for rental orders"""
    
    class Status(models.TextChoices):
        RESERVED = "RESERVED", "Reserved"
        ACTIVE = "ACTIVE", "Active Rental"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(RentalOrder, on_delete=models.CASCADE, related_name='reservations')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RESERVED)
    
    # Timing
    reserved_at = models.DateTimeField(auto_now_add=True)
    pickup_scheduled_at = models.DateTimeField(null=True, blank=True)
    actual_pickup_at = models.DateTimeField(null=True, blank=True)
    return_due_at = models.DateTimeField()
    actual_return_at = models.DateTimeField(null=True, blank=True)
    
    # Location
    pickup_location = models.TextField(blank=True)
    return_location = models.TextField(blank=True)
    
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reservations'
        verbose_name = 'Reservation'
        verbose_name_plural = 'Reservations'
        ordering = ['-reserved_at']
        indexes = [
            models.Index(fields=['order', 'status']),
            models.Index(fields=['status', 'return_due_at']),
        ]

    def __str__(self):
        return f"Reservation for {self.order.order_number}"


class ReservationItem(models.Model):
    """Individual product items in a reservation"""
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    
    # For serial-tracked items, link to specific inventory item
    # inventory_item = models.ForeignKey('catalog.ProductItem', on_delete=models.SET_NULL, null=True, blank=True)
    
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reservation_items'
        verbose_name = 'Reservation Item'
        verbose_name_plural = 'Reservation Items'
        indexes = [
            models.Index(fields=['reservation', 'product']),
            models.Index(fields=['product', 'start_datetime', 'end_datetime']),
        ]

    def __str__(self):
        return f"{self.product.name} x{self.quantity} - {self.reservation}"


class RentalContract(models.Model):
    """Legal rental contract generated from order"""
    order = models.OneToOneField(RentalOrder, on_delete=models.CASCADE, related_name='contract')
    contract_number = models.CharField(max_length=64, unique=True)
    
    # Contract content
    terms_and_conditions = models.TextField()
    customer_signature = models.TextField(blank=True)  # Digital signature data
    staff_signature = models.TextField(blank=True)
    
    # Dates
    signed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # File attachments (if any)
    contract_file = models.FileField(upload_to='contracts/', blank=True, null=True)

    class Meta:
        db_table = 'rental_contracts'
        verbose_name = 'Rental Contract'
        verbose_name_plural = 'Rental Contracts'

    def __str__(self):
        return f"Contract {self.contract_number}"

    def save(self, *args, **kwargs):
        if not self.contract_number:
            self.contract_number = f"RC-{self.order.order_number}"
        super().save(*args, **kwargs)

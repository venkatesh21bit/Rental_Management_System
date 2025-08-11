from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from apps.orders.models import Reservation

User = get_user_model()


class DeliveryDocument(models.Model):
    """Document for pickup/delivery of rental items"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SCHEDULED = "SCHEDULED", "Scheduled"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    class DocumentType(models.TextChoices):
        PICKUP = "PICKUP", "Pickup"
        DELIVERY = "DELIVERY", "Delivery"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_number = models.CharField(max_length=64, unique=True)
    reservation = models.ForeignKey(Reservation, on_delete=models.PROTECT, related_name='pickup_documents')
    document_type = models.CharField(max_length=10, choices=DocumentType.choices, default=DocumentType.PICKUP)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Assignment
    driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_deliveries')
    vehicle = models.CharField(max_length=100, blank=True)  # Vehicle details
    
    # Scheduling
    scheduled_datetime = models.DateTimeField(null=True, blank=True)
    estimated_duration = models.DurationField(null=True, blank=True)  # Expected time for pickup/delivery
    
    # Addresses
    pickup_address = models.TextField()
    delivery_address = models.TextField(blank=True)
    
    # Tracking
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # GPS coordinates for real-time tracking
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    
    # Additional Info
    special_instructions = models.TextField(blank=True)
    customer_contact = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    
    # Digital signatures
    customer_signature = models.TextField(blank=True)
    driver_signature = models.TextField(blank=True)
    
    # Photos/attachments
    photos = models.JSONField(default=list, blank=True)  # List of photo URLs
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'delivery_documents'
        verbose_name = 'Delivery Document'
        verbose_name_plural = 'Delivery Documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['driver', 'status']),
            models.Index(fields=['status', 'scheduled_datetime']),
            models.Index(fields=['document_number']),
            models.Index(fields=['reservation', 'document_type']),
        ]

    def __str__(self):
        return f"{self.document_type} {self.document_number} - {self.reservation.order.order_number}"

    def save(self, *args, **kwargs):
        if not self.document_number:
            self.document_number = self.generate_document_number()
        super().save(*args, **kwargs)

    def generate_document_number(self):
        """Generate unique document number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        prefix = 'PU' if self.document_type == self.DocumentType.PICKUP else 'DL'
        count = DeliveryDocument.objects.filter(
            document_type=self.document_type,
            created_at__date=timezone.now().date()
        ).count() + 1
        return f"{prefix}-{timestamp}-{count:04d}"

    @property
    def is_overdue(self):
        """Check if delivery is overdue"""
        if self.scheduled_datetime and self.status in [self.Status.PENDING, self.Status.SCHEDULED]:
            return timezone.now() > self.scheduled_datetime
        return False


class DeliveryItem(models.Model):
    """Individual items in a delivery document"""
    delivery_document = models.ForeignKey(DeliveryDocument, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    
    # Quantity details
    quantity_scheduled = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    quantity_delivered = models.PositiveIntegerField(default=0)
    quantity_returned = models.PositiveIntegerField(default=0)
    
    # Condition tracking
    condition_at_pickup = models.CharField(max_length=20, choices=[
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('damaged', 'Damaged')
    ], default='good')
    
    condition_at_return = models.CharField(max_length=20, choices=[
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('damaged', 'Damaged')
    ], blank=True)
    
    # Serial numbers or identifiers
    serial_numbers = models.JSONField(default=list, blank=True)
    
    notes = models.TextField(blank=True)
    damage_description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'delivery_items'
        verbose_name = 'Delivery Item'
        verbose_name_plural = 'Delivery Items'
        indexes = [
            models.Index(fields=['delivery_document', 'product']),
        ]

    def __str__(self):
        return f"{self.product.name} x{self.quantity_scheduled} - {self.delivery_document.document_number}"


class ReturnDocument(models.Model):
    """Document for return of rental items"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Return"
        SCHEDULED = "SCHEDULED", "Return Scheduled"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        COMPLETED = "COMPLETED", "Return Completed"
        PARTIAL = "PARTIAL", "Partial Return"
        OVERDUE = "OVERDUE", "Overdue"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_number = models.CharField(max_length=64, unique=True)
    reservation = models.ForeignKey(Reservation, on_delete=models.PROTECT, related_name='return_documents')
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Assignment
    driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_returns')
    vehicle = models.CharField(max_length=100, blank=True)
    
    # Scheduling
    scheduled_datetime = models.DateTimeField(null=True, blank=True)
    due_datetime = models.DateTimeField()  # When items are due back
    
    # Addresses
    pickup_address = models.TextField()  # Where to collect items from customer
    return_address = models.TextField()   # Warehouse/depot address
    
    # Tracking
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # GPS tracking
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    
    # Late fee calculation
    late_fee_applied = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Additional Info
    special_instructions = models.TextField(blank=True)
    customer_contact = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    
    # Digital signatures
    customer_signature = models.TextField(blank=True)
    driver_signature = models.TextField(blank=True)
    
    # Photos/attachments
    photos = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'return_documents'
        verbose_name = 'Return Document'
        verbose_name_plural = 'Return Documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['driver', 'status']),
            models.Index(fields=['status', 'due_datetime']),
            models.Index(fields=['document_number']),
            models.Index(fields=['reservation']),
        ]

    def __str__(self):
        return f"Return {self.document_number} - {self.reservation.order.order_number}"

    def save(self, *args, **kwargs):
        if not self.document_number:
            self.document_number = self.generate_document_number()
        super().save(*args, **kwargs)

    def generate_document_number(self):
        """Generate unique return document number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        count = ReturnDocument.objects.filter(
            created_at__date=timezone.now().date()
        ).count() + 1
        return f"RT-{timestamp}-{count:04d}"

    @property
    def is_overdue(self):
        """Check if return is overdue"""
        return timezone.now() > self.due_datetime and self.status not in [self.Status.COMPLETED, self.Status.CANCELLED]

    @property
    def days_overdue(self):
        """Calculate days overdue"""
        if self.is_overdue:
            delta = timezone.now() - self.due_datetime
            return delta.days
        return 0


class ReturnItem(models.Model):
    """Individual items in a return document"""
    return_document = models.ForeignKey(ReturnDocument, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    
    # Quantity details
    quantity_due = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    quantity_returned = models.PositiveIntegerField(default=0)
    quantity_missing = models.PositiveIntegerField(default=0)
    quantity_damaged = models.PositiveIntegerField(default=0)
    
    # Condition assessment
    condition_returned = models.CharField(max_length=20, choices=[
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('damaged', 'Damaged'),
        ('missing', 'Missing')
    ], default='good')
    
    # Serial numbers
    serial_numbers_returned = models.JSONField(default=list, blank=True)
    serial_numbers_missing = models.JSONField(default=list, blank=True)
    serial_numbers_damaged = models.JSONField(default=list, blank=True)
    
    # Damage/missing details
    damage_description = models.TextField(blank=True)
    damage_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    replacement_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'return_items'
        verbose_name = 'Return Item'
        verbose_name_plural = 'Return Items'
        indexes = [
            models.Index(fields=['return_document', 'product']),
        ]

    def __str__(self):
        return f"{self.product.name} x{self.quantity_due} - {self.return_document.document_number}"

    @property
    def is_complete_return(self):
        """Check if all items were returned in good condition"""
        return (self.quantity_returned == self.quantity_due and 
                self.quantity_missing == 0 and 
                self.quantity_damaged == 0)


class StockMovement(models.Model):
    """Track inventory movements related to deliveries and returns"""
    
    class MovementType(models.TextChoices):
        PICKUP = "PICKUP", "Pickup from Stock"
        RETURN = "RETURN", "Return to Stock"
        DAMAGE = "DAMAGE", "Damage Adjustment"
        LOSS = "LOSS", "Loss Adjustment"
        MAINTENANCE = "MAINTENANCE", "Maintenance"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    movement_number = models.CharField(max_length=64, unique=True)
    
    # References
    delivery_document = models.ForeignKey(DeliveryDocument, on_delete=models.SET_NULL, null=True, blank=True)
    return_document = models.ForeignKey(ReturnDocument, on_delete=models.SET_NULL, null=True, blank=True)
    
    movement_type = models.CharField(max_length=15, choices=MovementType.choices)
    
    # Product and quantity
    product = models.ForeignKey('catalog.Product', on_delete=models.PROTECT)
    quantity = models.IntegerField()  # Can be negative for outgoing stock
    
    # Location tracking
    from_location = models.CharField(max_length=100, blank=True)
    to_location = models.CharField(max_length=100, blank=True)
    
    # Staff responsible
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Additional details
    reason = models.TextField(blank=True)
    cost_impact = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        verbose_name = 'Stock Movement'
        verbose_name_plural = 'Stock Movements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'movement_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['movement_number']),
        ]

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        if not self.movement_number:
            self.movement_number = self.generate_movement_number()
        super().save(*args, **kwargs)

    def generate_movement_number(self):
        """Generate unique movement number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        count = StockMovement.objects.filter(
            created_at__date=timezone.now().date()
        ).count() + 1
        return f"SM-{timestamp}-{count:04d}"


class DeliveryRoute(models.Model):
    """Planned routes for deliveries and pickups"""
    
    class Status(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    route_name = models.CharField(max_length=100)
    route_date = models.DateField()
    
    # Assignment
    driver = models.ForeignKey(User, on_delete=models.PROTECT, related_name='delivery_routes')
    vehicle = models.CharField(max_length=100)
    
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PLANNED)
    
    # Route details
    start_location = models.TextField()
    end_location = models.TextField()
    estimated_distance = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    estimated_duration = models.DurationField(null=True, blank=True)
    
    # Timing
    planned_start_time = models.TimeField()
    actual_start_time = models.TimeField(null=True, blank=True)
    planned_end_time = models.TimeField()
    actual_end_time = models.TimeField(null=True, blank=True)
    
    # Associated documents
    delivery_documents = models.ManyToManyField(DeliveryDocument, blank=True)
    return_documents = models.ManyToManyField(ReturnDocument, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'delivery_routes'
        verbose_name = 'Delivery Route'
        verbose_name_plural = 'Delivery Routes'
        ordering = ['-route_date', '-planned_start_time']
        indexes = [
            models.Index(fields=['driver', 'route_date']),
            models.Index(fields=['status', 'route_date']),
        ]

    def __str__(self):
        return f"{self.route_name} - {self.route_date} ({self.driver.username})"

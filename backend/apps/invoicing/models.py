from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from apps.orders.models import RentalOrder

User = get_user_model()


class Invoice(models.Model):
    """Invoice for rental orders"""
    
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SENT = "SENT", "Sent"
        PAID = "PAID", "Paid"
        PARTIAL = "PARTIAL", "Partially Paid"
        OVERDUE = "OVERDUE", "Overdue"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"

    class InvoiceType(models.TextChoices):
        RENTAL = "RENTAL", "Rental Invoice"
        DEPOSIT = "DEPOSIT", "Security Deposit"
        LATE_FEE = "LATE_FEE", "Late Fee"
        DAMAGE = "DAMAGE", "Damage Charges"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=64, unique=True)
    order = models.ForeignKey(RentalOrder, on_delete=models.PROTECT, related_name='invoices')
    
    invoice_type = models.CharField(max_length=15, choices=InvoiceType.choices, default=InvoiceType.RENTAL)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    
    # Customer details (captured at time of invoice creation)
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='invoices')
    billing_name = models.CharField(max_length=255)
    billing_email = models.EmailField()
    billing_address = models.TextField()
    
    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    
    # Dates
    invoice_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    
    # Payment terms
    payment_terms = models.CharField(max_length=100, default='Net 30')
    
    # Additional info
    notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    
    # Tax details
    tax_number = models.CharField(max_length=50, blank=True)  # GST/VAT number
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_invoices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['status', 'due_date']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer.username}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)

    def generate_invoice_number(self):
        """Generate unique invoice number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        count = Invoice.objects.filter(
            created_at__date=timezone.now().date()
        ).count() + 1
        return f"INV-{timestamp}-{count:04d}"

    @property
    def balance_due(self):
        """Calculate remaining balance"""
        return self.total_amount - self.paid_amount

    @property
    def is_overdue(self):
        """Check if invoice is overdue"""
        return (timezone.now().date() > self.due_date and 
                self.status not in [self.Status.PAID, self.Status.CANCELLED, self.Status.REFUNDED])

    @property
    def days_overdue(self):
        """Calculate days overdue"""
        if self.is_overdue:
            delta = timezone.now().date() - self.due_date
            return delta.days
        return 0

    def mark_as_paid(self):
        """Mark invoice as fully paid"""
        self.status = self.Status.PAID
        self.paid_amount = self.total_amount
        self.save()

    def add_payment(self, amount):
        """Add partial payment"""
        self.paid_amount += amount
        if self.paid_amount >= self.total_amount:
            self.status = self.Status.PAID
            self.paid_amount = self.total_amount  # Prevent overpayment
        else:
            self.status = self.Status.PARTIAL
        self.save()


class InvoiceLine(models.Model):
    """Individual line items in an invoice"""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='lines')
    
    # Item details
    description = models.CharField(max_length=255)
    product = models.ForeignKey('catalog.Product', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Quantity and pricing
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Rental period (if applicable)
    rental_start = models.DateTimeField(null=True, blank=True)
    rental_end = models.DateTimeField(null=True, blank=True)
    
    # Tax details
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Totals
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Additional info
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invoice_lines'
        verbose_name = 'Invoice Line'
        verbose_name_plural = 'Invoice Lines'
        indexes = [
            models.Index(fields=['invoice', 'product']),
        ]

    def __str__(self):
        return f"{self.description} x{self.quantity} - {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        # Calculate line total
        subtotal = self.quantity * self.unit_price
        discount = self.discount_amount or (subtotal * self.discount_percent / 100)
        taxable_amount = subtotal - discount
        tax = taxable_amount * self.tax_rate / 100
        self.line_total = taxable_amount + tax
        super().save(*args, **kwargs)


class InvoiceTemplate(models.Model):
    """Templates for different types of invoices"""
    name = models.CharField(max_length=100, unique=True)
    invoice_type = models.CharField(max_length=15, choices=Invoice.InvoiceType.choices)
    
    # Template content
    header_text = models.TextField(blank=True)
    footer_text = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    
    # Default settings
    default_payment_terms = models.CharField(max_length=100, default='Net 30')
    default_due_days = models.PositiveIntegerField(default=30)
    
    # Tax settings
    include_tax = models.BooleanField(default=True)
    default_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoice_templates'
        verbose_name = 'Invoice Template'
        verbose_name_plural = 'Invoice Templates'

    def __str__(self):
        return f"{self.name} ({self.invoice_type})"


class PaymentTerm(models.Model):
    """Payment terms for invoices"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    
    # Payment schedule
    due_days = models.PositiveIntegerField()  # Days after invoice date
    
    # Discount terms
    early_payment_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    early_payment_days = models.PositiveIntegerField(default=0)
    
    # Late fee terms
    late_fee_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    late_fee_grace_days = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_terms'
        verbose_name = 'Payment Term'
        verbose_name_plural = 'Payment Terms'

    def __str__(self):
        return self.name


class CreditNote(models.Model):
    """Credit notes for refunds and adjustments"""
    
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ISSUED = "ISSUED", "Issued"
        APPLIED = "APPLIED", "Applied"
        CANCELLED = "CANCELLED", "Cancelled"

    class CreditType(models.TextChoices):
        REFUND = "REFUND", "Refund"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"
        DISCOUNT = "DISCOUNT", "Discount"
        RETURN = "RETURN", "Early Return"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_note_number = models.CharField(max_length=64, unique=True)
    
    # References
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='credit_notes')
    order = models.ForeignKey(RentalOrder, on_delete=models.PROTECT, related_name='credit_notes')
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='credit_notes')
    
    credit_type = models.CharField(max_length=15, choices=CreditType.choices)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    
    # Amounts
    credit_amount = models.DecimalField(max_digits=12, decimal_places=2)
    applied_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    
    # Details
    reason = models.TextField()
    notes = models.TextField(blank=True)
    
    # Dates
    issue_date = models.DateField(default=timezone.now)
    expiry_date = models.DateField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_credit_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'credit_notes'
        verbose_name = 'Credit Note'
        verbose_name_plural = 'Credit Notes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['credit_note_number']),
            models.Index(fields=['invoice']),
        ]

    def __str__(self):
        return f"Credit Note {self.credit_note_number} - {self.customer.username}"

    def save(self, *args, **kwargs):
        if not self.credit_note_number:
            self.credit_note_number = self.generate_credit_note_number()
        super().save(*args, **kwargs)

    def generate_credit_note_number(self):
        """Generate unique credit note number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        count = CreditNote.objects.filter(
            created_at__date=timezone.now().date()
        ).count() + 1
        return f"CN-{timestamp}-{count:04d}"

    @property
    def remaining_credit(self):
        """Calculate remaining credit amount"""
        return self.credit_amount - self.applied_amount

    def apply_credit(self, amount):
        """Apply credit to invoice or order"""
        if amount > self.remaining_credit:
            amount = self.remaining_credit
        
        self.applied_amount += amount
        if self.applied_amount >= self.credit_amount:
            self.status = self.Status.APPLIED
        self.save()
        
        return amount


class TaxRate(models.Model):
    """Tax rates for different regions/products"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Tax details
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    tax_type = models.CharField(max_length=20, choices=[
        ('gst', 'GST'),
        ('vat', 'VAT'),
        ('sales_tax', 'Sales Tax'),
        ('service_tax', 'Service Tax')
    ])
    
    # Applicability
    applicable_to_products = models.BooleanField(default=True)
    applicable_to_services = models.BooleanField(default=True)
    
    # Geographic scope
    country = models.CharField(max_length=100, default='India')
    state = models.CharField(max_length=100, blank=True)
    
    # Validity
    effective_from = models.DateField(default=timezone.now)
    effective_to = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tax_rates'
        verbose_name = 'Tax Rate'
        verbose_name_plural = 'Tax Rates'

    def __str__(self):
        return f"{self.name} ({self.rate}%)"

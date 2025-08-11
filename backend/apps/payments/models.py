from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from apps.invoicing.models import Invoice

User = get_user_model()


class PaymentProvider(models.Model):
    """Payment gateway providers"""
    
    class ProviderType(models.TextChoices):
        STRIPE = "STRIPE", "Stripe"
        RAZORPAY = "RAZORPAY", "Razorpay"
        PAYPAL = "PAYPAL", "PayPal"
        PAYU = "PAYU", "PayU"
        CASHFREE = "CASHFREE", "Cashfree"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
        CASH = "CASH", "Cash"
        CHEQUE = "CHEQUE", "Cheque"

    name = models.CharField(max_length=100, unique=True)
    provider_type = models.CharField(max_length=20, choices=ProviderType.choices)
    
    # Configuration
    is_active = models.BooleanField(default=True)
    is_test_mode = models.BooleanField(default=False)
    
    # API credentials (encrypted)
    api_key = models.TextField(blank=True)
    api_secret = models.TextField(blank=True)
    webhook_secret = models.TextField(blank=True)
    
    # Settings
    currency_supported = models.JSONField(default=list)  # ['INR', 'USD', etc.]
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, default=1.00)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, default=100000.00)
    
    # Fees
    processing_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    processing_fee_fixed = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Additional info
    description = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_providers'
        verbose_name = 'Payment Provider'
        verbose_name_plural = 'Payment Providers'

    def __str__(self):
        return f"{self.name} ({self.provider_type})"

    def calculate_processing_fee(self, amount):
        """Calculate processing fee for given amount"""
        percent_fee = amount * self.processing_fee_percent / 100
        return percent_fee + self.processing_fee_fixed


class Payment(models.Model):
    """Payment records"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"
        PARTIAL_REFUND = "PARTIAL_REFUND", "Partially Refunded"

    class PaymentMethod(models.TextChoices):
        CREDIT_CARD = "CREDIT_CARD", "Credit Card"
        DEBIT_CARD = "DEBIT_CARD", "Debit Card"
        NET_BANKING = "NET_BANKING", "Net Banking"
        UPI = "UPI", "UPI"
        WALLET = "WALLET", "Digital Wallet"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
        CASH = "CASH", "Cash"
        CHEQUE = "CHEQUE", "Cheque"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_number = models.CharField(max_length=64, unique=True)
    
    # References
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='payments')
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payments')
    
    # Payment details
    provider = models.ForeignKey(PaymentProvider, on_delete=models.PROTECT)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    
    # Gateway details
    gateway_payment_id = models.CharField(max_length=255, blank=True)
    gateway_order_id = models.CharField(max_length=255, blank=True)
    gateway_signature = models.TextField(blank=True)
    
    # Amounts
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    processing_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    refunded_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional info
    description = models.TextField(blank=True)
    failure_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Gateway response data
    gateway_response = models.JSONField(default=dict, blank=True)
    
    # Receipt
    receipt_number = models.CharField(max_length=64, blank=True)
    receipt_url = models.URLField(blank=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['invoice']),
            models.Index(fields=['payment_number']),
            models.Index(fields=['gateway_payment_id']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Payment {self.payment_number} - {self.amount} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.payment_number:
            self.payment_number = self.generate_payment_number()
        super().save(*args, **kwargs)

    def generate_payment_number(self):
        """Generate unique payment number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        count = Payment.objects.filter(
            created_at__date=timezone.now().date()
        ).count() + 1
        return f"PAY-{timestamp}-{count:04d}"

    @property
    def net_amount(self):
        """Net amount after processing fees"""
        return self.amount - self.processing_fee

    @property
    def refundable_amount(self):
        """Amount available for refund"""
        return self.amount - self.refunded_amount

    def mark_completed(self):
        """Mark payment as completed"""
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save()
        
        # Update invoice payment
        if self.invoice:
            self.invoice.add_payment(self.amount)

    def mark_failed(self, reason=""):
        """Mark payment as failed"""
        self.status = self.Status.FAILED
        self.failure_reason = reason
        self.save()

    def process_refund(self, amount, reason=""):
        """Process partial or full refund"""
        if amount > self.refundable_amount:
            raise ValueError("Refund amount exceeds refundable amount")
        
        # Create refund record
        refund = PaymentRefund.objects.create(
            payment=self,
            amount=amount,
            reason=reason
        )
        
        self.refunded_amount += amount
        
        if self.refunded_amount >= self.amount:
            self.status = self.Status.REFUNDED
        else:
            self.status = self.Status.PARTIAL_REFUND
        
        self.save()
        return refund


class PaymentRefund(models.Model):
    """Payment refund records"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    refund_number = models.CharField(max_length=64, unique=True)
    
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='refunds')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='INR')
    
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    
    # Gateway details
    gateway_refund_id = models.CharField(max_length=255, blank=True)
    
    # Details
    reason = models.TextField()
    notes = models.TextField(blank=True)
    
    # Timing
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Gateway response
    gateway_response = models.JSONField(default=dict, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_payment_refunds')

    class Meta:
        db_table = 'payment_refunds'
        verbose_name = 'Payment Refund'
        verbose_name_plural = 'Payment Refunds'
        ordering = ['-requested_at']

    def __str__(self):
        return f"Refund {self.refund_number} - {self.amount} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.refund_number:
            self.refund_number = self.generate_refund_number()
        super().save(*args, **kwargs)

    def generate_refund_number(self):
        """Generate unique refund number"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d')
        count = PaymentRefund.objects.filter(
            requested_at__date=timezone.now().date()
        ).count() + 1
        return f"REF-{timestamp}-{count:04d}"


class WebhookEvent(models.Model):
    """Webhook events from payment providers"""
    
    class Status(models.TextChoices):
        RECEIVED = "RECEIVED", "Received"
        PROCESSING = "PROCESSING", "Processing"
        PROCESSED = "PROCESSED", "Processed"
        FAILED = "FAILED", "Failed"
        IGNORED = "IGNORED", "Ignored"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Provider details
    provider = models.ForeignKey(PaymentProvider, on_delete=models.PROTECT)
    event_id = models.CharField(max_length=255)  # Provider's event ID
    event_type = models.CharField(max_length=100)  # payment.captured, payment.failed, etc.
    
    # Related objects
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True)
    refund = models.ForeignKey(PaymentRefund, on_delete=models.SET_NULL, null=True, blank=True)
    
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.RECEIVED)
    
    # Webhook data
    payload = models.JSONField()
    headers = models.JSONField(default=dict)
    
    # Processing
    processed_at = models.DateTimeField(null=True, blank=True)
    processing_notes = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    
    # Verification
    signature_verified = models.BooleanField(default=False)
    
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'webhook_events'
        verbose_name = 'Webhook Event'
        verbose_name_plural = 'Webhook Events'
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['provider', 'event_type']),
            models.Index(fields=['event_id']),
            models.Index(fields=['status', 'received_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['provider', 'event_id'],
                name='unique_provider_event'
            )
        ]

    def __str__(self):
        return f"Webhook {self.event_type} - {self.provider.name}"

    def mark_processed(self, notes=""):
        """Mark webhook as processed"""
        self.status = self.Status.PROCESSED
        self.processed_at = timezone.now()
        self.processing_notes = notes
        self.save()

    def mark_failed(self, error_message):
        """Mark webhook processing as failed"""
        self.status = self.Status.FAILED
        self.error_message = error_message
        self.processed_at = timezone.now()
        self.save()


class PaymentLink(models.Model):
    """Payment links for customers"""
    
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        EXPIRED = "EXPIRED", "Expired"
        PAID = "PAID", "Paid"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    link_id = models.CharField(max_length=64, unique=True)
    
    # References
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='payment_links')
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='customer_payment_links')
    
    # Link details
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='INR')
    description = models.TextField()
    
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    
    # Expiry
    expires_at = models.DateTimeField()
    
    # Payment details
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Access
    access_count = models.PositiveIntegerField(default=0)
    max_access_count = models.PositiveIntegerField(default=10)
    
    # Notifications
    send_sms = models.BooleanField(default=False)
    send_email = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_payment_links')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_links'
        verbose_name = 'Payment Link'
        verbose_name_plural = 'Payment Links'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment Link {self.link_id} - {self.amount} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.link_id:
            self.link_id = self.generate_link_id()
        super().save(*args, **kwargs)

    def generate_link_id(self):
        """Generate unique link ID"""
        import string
        import random
        return ''.join(random.choices(string.ascii_letters + string.digits, k=16))

    @property
    def is_expired(self):
        """Check if link has expired"""
        return timezone.now() > self.expires_at or self.access_count >= self.max_access_count

    @property
    def payment_url(self):
        """Generate payment URL"""
        # This would be your domain + payment page
        return f"https://yourdomain.com/pay/{self.link_id}"

    def record_access(self):
        """Record an access to the payment link"""
        self.access_count += 1
        if self.access_count >= self.max_access_count:
            self.status = self.Status.EXPIRED
        self.save()


class BankAccount(models.Model):
    """Bank accounts for payments and refunds"""
    
    class AccountType(models.TextChoices):
        CHECKING = "CHECKING", "Checking"
        SAVINGS = "SAVINGS", "Savings"
        BUSINESS = "BUSINESS", "Business"

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bank_accounts')
    
    # Account details
    account_holder_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    routing_number = models.CharField(max_length=20, blank=True)  # For US
    ifsc_code = models.CharField(max_length=20, blank=True)       # For India
    swift_code = models.CharField(max_length=20, blank=True)     # For international
    
    bank_name = models.CharField(max_length=255)
    branch_name = models.CharField(max_length=255, blank=True)
    
    account_type = models.CharField(max_length=15, choices=AccountType.choices, default=AccountType.CHECKING)
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verification_document = models.FileField(upload_to='bank_documents/', blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bank_accounts'
        verbose_name = 'Bank Account'
        verbose_name_plural = 'Bank Accounts'

    def __str__(self):
        masked_account = f"****{self.account_number[-4:]}" if len(self.account_number) > 4 else self.account_number
        return f"{self.bank_name} - {masked_account}"

    def save(self, *args, **kwargs):
        # Ensure only one default account per customer
        if self.is_default:
            BankAccount.objects.filter(
                customer=self.customer,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

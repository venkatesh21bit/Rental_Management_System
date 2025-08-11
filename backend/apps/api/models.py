from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class APIKey(models.Model):
    """API keys for external integrations"""
    
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        REVOKED = "REVOKED", "Revoked"
        EXPIRED = "EXPIRED", "Expired"
        SUSPENDED = "SUSPENDED", "Suspended"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=64, unique=True)
    
    # Owner
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    
    # Permissions
    scopes = models.JSONField(default=list)  # ['read:orders', 'write:products', etc.]
    rate_limit_per_minute = models.PositiveIntegerField(default=60)
    rate_limit_per_hour = models.PositiveIntegerField(default=1000)
    rate_limit_per_day = models.PositiveIntegerField(default=10000)
    
    # IP restrictions
    allowed_ips = models.JSONField(default=list, blank=True)  # Empty list = allow all
    
    # Status
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    
    # Usage tracking
    last_used_at = models.DateTimeField(null=True, blank=True)
    total_requests = models.PositiveBigIntegerField(default=0)
    
    # Validity
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_keys'
        verbose_name = 'API Key'
        verbose_name_plural = 'API Keys'

    def __str__(self):
        return f"{self.name} - {self.key[:8]}..."

    @property
    def is_valid(self):
        """Check if API key is valid"""
        if self.status != self.Status.ACTIVE:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    def record_usage(self):
        """Record API key usage"""
        self.last_used_at = timezone.now()
        self.total_requests += 1
        self.save(update_fields=['last_used_at', 'total_requests'])


class APIRequest(models.Model):
    """Log of API requests for monitoring and analytics"""
    
    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        ERROR = "ERROR", "Error"
        TIMEOUT = "TIMEOUT", "Timeout"
        RATE_LIMITED = "RATE_LIMITED", "Rate Limited"
        UNAUTHORIZED = "UNAUTHORIZED", "Unauthorized"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Request details
    api_key = models.ForeignKey(APIKey, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # HTTP details
    method = models.CharField(max_length=10)  # GET, POST, PUT, DELETE
    endpoint = models.CharField(max_length=255)
    query_params = models.JSONField(default=dict, blank=True)
    
    # Request metadata
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    # Response details
    status_code = models.PositiveIntegerField()
    status = models.CharField(max_length=15, choices=Status.choices)
    response_time_ms = models.PositiveIntegerField()  # Response time in milliseconds
    response_size_bytes = models.PositiveIntegerField(default=0)
    
    # Error details
    error_message = models.TextField(blank=True)
    
    # Timing
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_requests'
        verbose_name = 'API Request'
        verbose_name_plural = 'API Requests'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['api_key', 'timestamp']),
            models.Index(fields=['endpoint', 'timestamp']),
            models.Index(fields=['status', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.status_code}"


class WebhookEndpoint(models.Model):
    """Webhook endpoints for external integrations"""
    
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        FAILED = "FAILED", "Failed"

    class EventType(models.TextChoices):
        ORDER_CREATED = "ORDER_CREATED", "Order Created"
        ORDER_UPDATED = "ORDER_UPDATED", "Order Updated"
        ORDER_CANCELLED = "ORDER_CANCELLED", "Order Cancelled"
        PAYMENT_COMPLETED = "PAYMENT_COMPLETED", "Payment Completed"
        PAYMENT_FAILED = "PAYMENT_FAILED", "Payment Failed"
        RENTAL_STARTED = "RENTAL_STARTED", "Rental Started"
        RENTAL_ENDED = "RENTAL_ENDED", "Rental Ended"
        ITEM_OVERDUE = "ITEM_OVERDUE", "Item Overdue"
        DELIVERY_COMPLETED = "DELIVERY_COMPLETED", "Delivery Completed"
        RETURN_COMPLETED = "RETURN_COMPLETED", "Return Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    url = models.URLField()
    
    # Owner
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='webhook_endpoints')
    
    # Event subscription
    event_types = models.JSONField(default=list)  # List of EventType choices
    
    # Security
    secret = models.CharField(max_length=64)  # For signature verification
    
    # Configuration
    is_active = models.BooleanField(default=True)
    retry_count = models.PositiveIntegerField(default=3)
    timeout_seconds = models.PositiveIntegerField(default=30)
    
    # Status tracking
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    last_delivery_at = models.DateTimeField(null=True, blank=True)
    consecutive_failures = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'webhook_endpoints'
        verbose_name = 'Webhook Endpoint'
        verbose_name_plural = 'Webhook Endpoints'

    def __str__(self):
        return f"{self.name} - {self.url}"

    def record_success(self):
        """Record successful webhook delivery"""
        self.last_delivery_at = timezone.now()
        self.consecutive_failures = 0
        self.status = self.Status.ACTIVE
        self.save()

    def record_failure(self):
        """Record failed webhook delivery"""
        self.consecutive_failures += 1
        if self.consecutive_failures >= 5:  # Disable after 5 consecutive failures
            self.status = self.Status.FAILED
        self.save()


class WebhookDelivery(models.Model):
    """Log of webhook deliveries"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED = "FAILED", "Failed"
        RETRYING = "RETRYING", "Retrying"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    endpoint = models.ForeignKey(WebhookEndpoint, on_delete=models.CASCADE, related_name='deliveries')
    event_type = models.CharField(max_length=25, choices=WebhookEndpoint.EventType.choices)
    
    # Payload
    payload = models.JSONField()
    
    # Delivery details
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    attempts = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=3)
    
    # Response details
    response_status = models.PositiveIntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    response_time_ms = models.PositiveIntegerField(null=True, blank=True)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    next_retry_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'webhook_deliveries'
        verbose_name = 'Webhook Delivery'
        verbose_name_plural = 'Webhook Deliveries'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} to {self.endpoint.name} - {self.status}"

    def can_retry(self):
        """Check if delivery can be retried"""
        return self.attempts < self.max_attempts and self.status in [self.Status.FAILED, self.Status.RETRYING]

    def schedule_retry(self):
        """Schedule next retry attempt"""
        if self.can_retry():
            # Exponential backoff: 1min, 5min, 15min
            retry_delays = [60, 300, 900]
            delay_seconds = retry_delays[min(self.attempts, len(retry_delays) - 1)]
            
            self.next_retry_at = timezone.now() + timezone.timedelta(seconds=delay_seconds)
            self.status = self.Status.RETRYING
            self.save()


class ExternalIntegration(models.Model):
    """Configuration for external system integrations"""
    
    class IntegrationType(models.TextChoices):
        ACCOUNTING = "ACCOUNTING", "Accounting System"
        CRM = "CRM", "CRM System"
        INVENTORY = "INVENTORY", "Inventory Management"
        PAYMENT = "PAYMENT", "Payment Gateway"
        SHIPPING = "SHIPPING", "Shipping Provider"
        ANALYTICS = "ANALYTICS", "Analytics Platform"
        CUSTOM = "CUSTOM", "Custom Integration"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ERROR = "ERROR", "Error"
        TESTING = "TESTING", "Testing"

    name = models.CharField(max_length=100, unique=True)
    integration_type = models.CharField(max_length=15, choices=IntegrationType.choices)
    description = models.TextField(blank=True)
    
    # Configuration
    base_url = models.URLField(blank=True)
    api_key = models.TextField(blank=True)
    api_secret = models.TextField(blank=True)
    additional_config = models.JSONField(default=dict, blank=True)
    
    # Status
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.INACTIVE)
    is_enabled = models.BooleanField(default=False)
    
    # Sync settings
    auto_sync = models.BooleanField(default=False)
    sync_interval_minutes = models.PositiveIntegerField(default=60)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    last_error = models.TextField(blank=True)
    consecutive_errors = models.PositiveIntegerField(default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_external_integrations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'external_integrations'
        verbose_name = 'External Integration'
        verbose_name_plural = 'External Integrations'

    def __str__(self):
        return f"{self.name} ({self.integration_type})"

    def record_sync_success(self):
        """Record successful sync"""
        self.last_sync_at = timezone.now()
        self.consecutive_errors = 0
        self.last_error = ""
        self.status = self.Status.ACTIVE
        self.save()

    def record_sync_error(self, error_message):
        """Record sync error"""
        self.last_error = error_message
        self.consecutive_errors += 1
        self.status = self.Status.ERROR
        
        # Disable after too many consecutive errors
        if self.consecutive_errors >= 5:
            self.is_enabled = False
        
        self.save()


class APIRateLimit(models.Model):
    """Rate limiting tracking for API endpoints"""
    
    api_key = models.ForeignKey(APIKey, on_delete=models.CASCADE)
    endpoint = models.CharField(max_length=255)
    
    # Time windows
    minute_count = models.PositiveIntegerField(default=0)
    hour_count = models.PositiveIntegerField(default=0)
    day_count = models.PositiveIntegerField(default=0)
    
    # Reset timestamps
    minute_reset = models.DateTimeField()
    hour_reset = models.DateTimeField()
    day_reset = models.DateTimeField()
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_rate_limits'
        unique_together = ['api_key', 'endpoint']

    def __str__(self):
        return f"{self.api_key.name} - {self.endpoint}"

    def increment_counts(self):
        """Increment rate limit counts"""
        now = timezone.now()
        
        # Reset counters if time windows have expired
        if now >= self.minute_reset:
            self.minute_count = 0
            self.minute_reset = now + timezone.timedelta(minutes=1)
        
        if now >= self.hour_reset:
            self.hour_count = 0
            self.hour_reset = now + timezone.timedelta(hours=1)
        
        if now >= self.day_reset:
            self.day_count = 0
            self.day_reset = now + timezone.timedelta(days=1)
        
        # Increment counters
        self.minute_count += 1
        self.hour_count += 1
        self.day_count += 1
        
        self.save()

    def is_rate_limited(self):
        """Check if rate limits are exceeded"""
        return (
            self.minute_count >= self.api_key.rate_limit_per_minute or
            self.hour_count >= self.api_key.rate_limit_per_hour or
            self.day_count >= self.api_key.rate_limit_per_day
        )

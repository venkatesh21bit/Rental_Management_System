from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid
from apps.orders.models import Reservation, RentalOrder
from apps.invoicing.models import Invoice

User = get_user_model()


class NotificationTemplate(models.Model):
    """Templates for different types of notifications"""
    
    class NotificationType(models.TextChoices):
        ORDER_CONFIRMATION = "ORDER_CONFIRMATION", "Order Confirmation"
        PICKUP_REMINDER = "PICKUP_REMINDER", "Pickup Reminder"
        RETURN_REMINDER = "RETURN_REMINDER", "Return Reminder"
        OVERDUE_NOTICE = "OVERDUE_NOTICE", "Overdue Notice"
        PAYMENT_REMINDER = "PAYMENT_REMINDER", "Payment Reminder"
        PAYMENT_CONFIRMATION = "PAYMENT_CONFIRMATION", "Payment Confirmation"
        QUOTE_SENT = "QUOTE_SENT", "Quote Sent"
        DELIVERY_UPDATE = "DELIVERY_UPDATE", "Delivery Update"
        MAINTENANCE_ALERT = "MAINTENANCE_ALERT", "Maintenance Alert"
        CUSTOM = "CUSTOM", "Custom Notification"

    class Channel(models.TextChoices):
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        PUSH = "PUSH", "Push Notification"
        IN_APP = "IN_APP", "In-App Notification"
        WHATSAPP = "WHATSAPP", "WhatsApp"

    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=25, choices=NotificationType.choices)
    channel = models.CharField(max_length=10, choices=Channel.choices)
    
    # Template content
    subject = models.CharField(max_length=255, blank=True)  # For email
    content = models.TextField()  # Main message content
    html_content = models.TextField(blank=True)  # HTML version for email
    
    # Template variables (JSON list of available variables)
    available_variables = models.JSONField(default=list, blank=True)
    
    # Settings
    is_active = models.BooleanField(default=True)
    is_system_template = models.BooleanField(default=False)  # System templates can't be deleted
    
    # Scheduling
    send_immediately = models.BooleanField(default=True)
    delay_minutes = models.PositiveIntegerField(default=0)  # Delay before sending
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_templates'
        verbose_name = 'Notification Template'
        verbose_name_plural = 'Notification Templates'
        constraints = [
            models.UniqueConstraint(
                fields=['notification_type', 'channel'],
                name='unique_template_type_channel'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.channel})"


class NotificationSetting(models.Model):
    """User notification preferences"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Email notifications
    email_order_confirmations = models.BooleanField(default=True)
    email_pickup_reminders = models.BooleanField(default=True)
    email_return_reminders = models.BooleanField(default=True)
    email_overdue_notices = models.BooleanField(default=True)
    email_payment_reminders = models.BooleanField(default=True)
    email_payment_confirmations = models.BooleanField(default=True)
    email_promotional = models.BooleanField(default=False)
    
    # SMS notifications
    sms_pickup_reminders = models.BooleanField(default=True)
    sms_return_reminders = models.BooleanField(default=True)
    sms_overdue_notices = models.BooleanField(default=True)
    sms_payment_reminders = models.BooleanField(default=False)
    sms_delivery_updates = models.BooleanField(default=True)
    
    # Push notifications
    push_all_notifications = models.BooleanField(default=True)
    push_order_updates = models.BooleanField(default=True)
    push_payment_updates = models.BooleanField(default=True)
    push_promotional = models.BooleanField(default=False)
    
    # WhatsApp notifications
    whatsapp_enabled = models.BooleanField(default=False)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    
    # Timing preferences
    email_frequency = models.CharField(max_length=15, choices=[
        ('immediate', 'Immediate'),
        ('daily_digest', 'Daily Digest'),
        ('weekly_digest', 'Weekly Digest')
    ], default='immediate')
    
    quiet_hours_start = models.TimeField(default='22:00:00')
    quiet_hours_end = models.TimeField(default='08:00:00')
    timezone = models.CharField(max_length=50, default='Asia/Kolkata')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_settings'
        verbose_name = 'Notification Setting'
        verbose_name_plural = 'Notification Settings'

    def __str__(self):
        return f"Notification Settings - {self.user.username}"


class Notification(models.Model):
    """Individual notification records"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SCHEDULED = "SCHEDULED", "Scheduled"
        SENT = "SENT", "Sent"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        NORMAL = "NORMAL", "Normal"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Recipients
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Content
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    notification_type = models.CharField(max_length=25, choices=NotificationTemplate.NotificationType.choices)
    channel = models.CharField(max_length=10, choices=NotificationTemplate.Channel.choices)
    
    subject = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    html_content = models.TextField(blank=True)
    
    # Context/References
    order = models.ForeignKey(RentalOrder, on_delete=models.SET_NULL, null=True, blank=True)
    reservation = models.ForeignKey(Reservation, on_delete=models.SET_NULL, null=True, blank=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    context_data = models.JSONField(default=dict, blank=True)  # Template variables
    
    # Scheduling
    scheduled_for = models.DateTimeField(default=timezone.now)
    
    # Status tracking
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL)
    
    # Delivery tracking
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Provider details
    provider_message_id = models.CharField(max_length=255, blank=True)
    provider_response = models.JSONField(default=dict, blank=True)
    
    # Error handling
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'scheduled_for']),
            models.Index(fields=['notification_type', 'channel']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type} to {self.user.username} via {self.channel}"

    def mark_sent(self, provider_message_id=""):
        """Mark notification as sent"""
        self.status = self.Status.SENT
        self.sent_at = timezone.now()
        self.provider_message_id = provider_message_id
        self.save()

    def mark_delivered(self):
        """Mark notification as delivered"""
        self.status = self.Status.DELIVERED
        self.delivered_at = timezone.now()
        self.save()

    def mark_read(self):
        """Mark notification as read (for in-app notifications)"""
        self.read_at = timezone.now()
        self.save()

    def mark_failed(self, error_message):
        """Mark notification as failed"""
        self.status = self.Status.FAILED
        self.error_message = error_message
        self.save()

    def can_retry(self):
        """Check if notification can be retried"""
        return self.retry_count < self.max_retries and self.status == self.Status.FAILED

    def retry(self):
        """Retry sending notification"""
        if self.can_retry():
            self.retry_count += 1
            self.status = self.Status.PENDING
            self.error_message = ""
            self.save()
            return True
        return False


class ScheduledNotification(models.Model):
    """Recurring notification schedules"""
    
    class ScheduleType(models.TextChoices):
        PICKUP_REMINDER = "PICKUP_REMINDER", "Pickup Reminder"
        RETURN_REMINDER = "RETURN_REMINDER", "Return Reminder"
        PAYMENT_REMINDER = "PAYMENT_REMINDER", "Payment Reminder"
        OVERDUE_CHECK = "OVERDUE_CHECK", "Overdue Check"
        MAINTENANCE_REMINDER = "MAINTENANCE_REMINDER", "Maintenance Reminder"

    class Frequency(models.TextChoices):
        ONCE = "ONCE", "Once"
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"
        MONTHLY = "MONTHLY", "Monthly"

    name = models.CharField(max_length=100)
    schedule_type = models.CharField(max_length=25, choices=ScheduleType.choices)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.PROTECT)
    
    # Trigger conditions
    days_before_event = models.IntegerField(default=1)  # Days before the target date
    days_after_event = models.IntegerField(default=0)   # Days after the target date
    
    # Schedule settings
    frequency = models.CharField(max_length=10, choices=Frequency.choices, default=Frequency.ONCE)
    is_active = models.BooleanField(default=True)
    
    # Time settings
    send_time = models.TimeField(default='10:00:00')  # Time of day to send
    
    # Last run tracking
    last_run_at = models.DateTimeField(null=True, blank=True)
    next_run_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'scheduled_notifications'
        verbose_name = 'Scheduled Notification'
        verbose_name_plural = 'Scheduled Notifications'

    def __str__(self):
        return f"{self.name} ({self.schedule_type})"

    def update_next_run(self):
        """Calculate next run time based on frequency"""
        from datetime import timedelta
        
        base_time = self.last_run_at or timezone.now()
        
        if self.frequency == self.Frequency.DAILY:
            self.next_run_at = base_time + timedelta(days=1)
        elif self.frequency == self.Frequency.WEEKLY:
            self.next_run_at = base_time + timedelta(weeks=1)
        elif self.frequency == self.Frequency.MONTHLY:
            self.next_run_at = base_time + timedelta(days=30)
        else:  # ONCE
            self.next_run_at = None
            self.is_active = False
        
        self.save()


class NotificationLog(models.Model):
    """Log of notification batch operations"""
    
    class Operation(models.TextChoices):
        PICKUP_REMINDERS = "PICKUP_REMINDERS", "Pickup Reminders"
        RETURN_REMINDERS = "RETURN_REMINDERS", "Return Reminders"
        OVERDUE_NOTICES = "OVERDUE_NOTICES", "Overdue Notices"
        PAYMENT_REMINDERS = "PAYMENT_REMINDERS", "Payment Reminders"
        BULK_NOTIFICATION = "BULK_NOTIFICATION", "Bulk Notification"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operation = models.CharField(max_length=25, choices=Operation.choices)
    
    # Execution details
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    total_notifications = models.PositiveIntegerField(default=0)
    successful_notifications = models.PositiveIntegerField(default=0)
    failed_notifications = models.PositiveIntegerField(default=0)
    
    # Details
    filters_applied = models.JSONField(default=dict, blank=True)
    errors = models.JSONField(default=list, blank=True)
    
    # Execution context
    triggered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_scheduled = models.BooleanField(default=False)

    class Meta:
        db_table = 'notification_logs'
        verbose_name = 'Notification Log'
        verbose_name_plural = 'Notification Logs'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.operation} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"

    def mark_completed(self):
        """Mark log as completed"""
        self.completed_at = timezone.now()
        self.save()

    def add_error(self, error_message, context=None):
        """Add error to the log"""
        error_entry = {
            'timestamp': timezone.now().isoformat(),
            'message': error_message
        }
        if context:
            error_entry['context'] = context
        
        self.errors.append(error_entry)
        self.failed_notifications += 1
        self.save()

    def add_success(self):
        """Increment successful notifications count"""
        self.successful_notifications += 1
        self.save()


class NotificationProvider(models.Model):
    """Configuration for notification providers"""
    
    class ProviderType(models.TextChoices):
        SMTP = "SMTP", "SMTP Email"
        SENDGRID = "SENDGRID", "SendGrid"
        MAILGUN = "MAILGUN", "Mailgun"
        SES = "SES", "Amazon SES"
        TWILIO = "TWILIO", "Twilio SMS"
        FIREBASE = "FIREBASE", "Firebase Push"
        WHATSAPP_BUSINESS = "WHATSAPP_BUSINESS", "WhatsApp Business"

    name = models.CharField(max_length=100, unique=True)
    provider_type = models.CharField(max_length=20, choices=ProviderType.choices)
    channel = models.CharField(max_length=10, choices=NotificationTemplate.Channel.choices)
    
    # Configuration
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    # API configuration
    api_key = models.TextField(blank=True)
    api_secret = models.TextField(blank=True)
    api_endpoint = models.URLField(blank=True)
    
    # Additional settings
    configuration = models.JSONField(default=dict, blank=True)
    
    # Rate limiting
    rate_limit_per_minute = models.PositiveIntegerField(null=True, blank=True)
    rate_limit_per_hour = models.PositiveIntegerField(null=True, blank=True)
    rate_limit_per_day = models.PositiveIntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_providers'
        verbose_name = 'Notification Provider'
        verbose_name_plural = 'Notification Providers'

    def __str__(self):
        return f"{self.name} ({self.provider_type})"

    def save(self, *args, **kwargs):
        # Ensure only one default provider per channel
        if self.is_default:
            NotificationProvider.objects.filter(
                channel=self.channel,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator
import uuid

User = get_user_model()


class ReportTemplate(models.Model):
    """Templates for different types of reports"""
    
    class ReportType(models.TextChoices):
        RENTAL_SUMMARY = "RENTAL_SUMMARY", "Rental Summary"
        REVENUE_ANALYSIS = "REVENUE_ANALYSIS", "Revenue Analysis"
        PRODUCT_UTILIZATION = "PRODUCT_UTILIZATION", "Product Utilization"
        CUSTOMER_ANALYSIS = "CUSTOMER_ANALYSIS", "Customer Analysis"
        OVERDUE_REPORT = "OVERDUE_REPORT", "Overdue Report"
        PAYMENT_REPORT = "PAYMENT_REPORT", "Payment Report"
        INVENTORY_REPORT = "INVENTORY_REPORT", "Inventory Report"
        DELIVERY_PERFORMANCE = "DELIVERY_PERFORMANCE", "Delivery Performance"
        DAMAGE_REPORT = "DAMAGE_REPORT", "Damage Report"
        CUSTOM = "CUSTOM", "Custom Report"

    class OutputFormat(models.TextChoices):
        PDF = "PDF", "PDF"
        EXCEL = "EXCEL", "Excel"
        CSV = "CSV", "CSV"
        JSON = "JSON", "JSON"

    name = models.CharField(max_length=100, unique=True)
    report_type = models.CharField(max_length=25, choices=ReportType.choices)
    description = models.TextField(blank=True)
    
    # Query configuration
    base_query = models.TextField()  # SQL query or Django ORM query
    filters = models.JSONField(default=dict, blank=True)  # Available filters
    
    # Output configuration
    default_format = models.CharField(max_length=10, choices=OutputFormat.choices, default=OutputFormat.PDF)
    columns = models.JSONField(default=list, blank=True)  # Column definitions
    
    # Scheduling
    can_be_scheduled = models.BooleanField(default=True)
    
    # Access control
    is_public = models.BooleanField(default=False)
    allowed_roles = models.JSONField(default=list, blank=True)  # ['admin', 'staff', etc.]
    
    # Template settings
    is_active = models.BooleanField(default=True)
    is_system_template = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_report_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'report_templates'
        verbose_name = 'Report Template'
        verbose_name_plural = 'Report Templates'

    def __str__(self):
        return f"{self.name} ({self.report_type})"


class Report(models.Model):
    """Generated report instances"""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        GENERATING = "GENERATING", "Generating"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        EXPIRED = "EXPIRED", "Expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Template and parameters
    template = models.ForeignKey(ReportTemplate, on_delete=models.PROTECT)
    name = models.CharField(max_length=255)
    
    # Generation parameters
    filters_applied = models.JSONField(default=dict, blank=True)
    date_range_start = models.DateField(null=True, blank=True)
    date_range_end = models.DateField(null=True, blank=True)
    
    # Output
    output_format = models.CharField(max_length=10, choices=ReportTemplate.OutputFormat.choices)
    file_path = models.FileField(upload_to='reports/', blank=True, null=True)
    file_size = models.PositiveBigIntegerField(null=True, blank=True)  # File size in bytes
    
    # Generation tracking
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    
    # Timing
    requested_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Generation details
    total_records = models.PositiveIntegerField(null=True, blank=True)
    generation_time_seconds = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    # Access control
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_reports')
    is_shared = models.BooleanField(default=False)
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_reports')
    
    # Auto-cleanup
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'reports'
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['requested_by', 'status']),
            models.Index(fields=['template', 'status']),
            models.Index(fields=['status', 'requested_at']),
        ]

    def __str__(self):
        return f"{self.name} - {self.status}"

    def mark_generating(self):
        """Mark report as being generated"""
        self.status = self.Status.GENERATING
        self.started_at = timezone.now()
        self.save()

    def mark_completed(self, file_path, total_records=None):
        """Mark report as completed"""
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.file_path = file_path
        self.total_records = total_records
        
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.generation_time_seconds = delta.total_seconds()
        
        # Set expiry (30 days from completion)
        from datetime import timedelta
        self.expires_at = self.completed_at + timedelta(days=30)
        
        self.save()

    def mark_failed(self, error_message):
        """Mark report as failed"""
        self.status = self.Status.FAILED
        self.error_message = error_message
        self.save()

    @property
    def is_expired(self):
        """Check if report has expired"""
        return self.expires_at and timezone.now() > self.expires_at

    @property
    def download_url(self):
        """Get download URL for the report"""
        if self.file_path:
            return self.file_path.url
        return None


class ScheduledReport(models.Model):
    """Scheduled automatic report generation"""
    
    class Frequency(models.TextChoices):
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"
        MONTHLY = "MONTHLY", "Monthly"
        QUARTERLY = "QUARTERLY", "Quarterly"
        YEARLY = "YEARLY", "Yearly"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"
        INACTIVE = "INACTIVE", "Inactive"

    name = models.CharField(max_length=100)
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE)
    
    # Scheduling
    frequency = models.CharField(max_length=15, choices=Frequency.choices)
    schedule_time = models.TimeField(default='09:00:00')  # Time of day to generate
    
    # Parameters
    default_filters = models.JSONField(default=dict, blank=True)
    output_format = models.CharField(max_length=10, choices=ReportTemplate.OutputFormat.choices)
    
    # Recipients
    email_recipients = models.JSONField(default=list, blank=True)  # List of email addresses
    auto_send_email = models.BooleanField(default=False)
    
    # Status
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    
    # Execution tracking
    last_run_at = models.DateTimeField(null=True, blank=True)
    next_run_at = models.DateTimeField(null=True, blank=True)
    last_report = models.ForeignKey(Report, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Error tracking
    consecutive_failures = models.PositiveIntegerField(default=0)
    max_failures = models.PositiveIntegerField(default=3)
    last_error = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_scheduled_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'scheduled_reports'
        verbose_name = 'Scheduled Report'
        verbose_name_plural = 'Scheduled Reports'

    def __str__(self):
        return f"{self.name} ({self.frequency})"

    def calculate_next_run(self):
        """Calculate next run time based on frequency"""
        from datetime import timedelta, datetime
        import calendar
        
        now = timezone.now()
        next_run = datetime.combine(now.date(), self.schedule_time)
        
        # If today's scheduled time has passed, start from tomorrow
        if next_run <= now:
            next_run += timedelta(days=1)
        
        if self.frequency == self.Frequency.DAILY:
            pass  # next_run is already set correctly
        elif self.frequency == self.Frequency.WEEKLY:
            # Find next occurrence of the same weekday
            days_ahead = 7 - next_run.weekday()
            if days_ahead == 7:
                days_ahead = 0
            next_run += timedelta(days=days_ahead)
        elif self.frequency == self.Frequency.MONTHLY:
            # First day of next month
            if next_run.month == 12:
                next_run = next_run.replace(year=next_run.year + 1, month=1, day=1)
            else:
                next_run = next_run.replace(month=next_run.month + 1, day=1)
        elif self.frequency == self.Frequency.QUARTERLY:
            # First day of next quarter
            current_quarter = (next_run.month - 1) // 3 + 1
            if current_quarter == 4:
                next_run = next_run.replace(year=next_run.year + 1, month=1, day=1)
            else:
                next_month = current_quarter * 3 + 1
                next_run = next_run.replace(month=next_month, day=1)
        elif self.frequency == self.Frequency.YEARLY:
            next_run = next_run.replace(year=next_run.year + 1, month=1, day=1)
        
        self.next_run_at = timezone.make_aware(next_run)
        self.save()

    def record_success(self, report):
        """Record successful execution"""
        self.last_run_at = timezone.now()
        self.last_report = report
        self.consecutive_failures = 0
        self.last_error = ""
        self.calculate_next_run()

    def record_failure(self, error_message):
        """Record failed execution"""
        self.last_run_at = timezone.now()
        self.consecutive_failures += 1
        self.last_error = error_message
        
        # Pause if too many consecutive failures
        if self.consecutive_failures >= self.max_failures:
            self.status = self.Status.PAUSED
        
        self.calculate_next_run()


class DashboardWidget(models.Model):
    """Dashboard widgets for real-time analytics"""
    
    class WidgetType(models.TextChoices):
        METRIC = "METRIC", "Single Metric"
        CHART = "CHART", "Chart"
        TABLE = "TABLE", "Table"
        GAUGE = "GAUGE", "Gauge"
        MAP = "MAP", "Map"

    class ChartType(models.TextChoices):
        LINE = "LINE", "Line Chart"
        BAR = "BAR", "Bar Chart"
        PIE = "PIE", "Pie Chart"
        DOUGHNUT = "DOUGHNUT", "Doughnut Chart"
        AREA = "AREA", "Area Chart"

    name = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Widget configuration
    widget_type = models.CharField(max_length=10, choices=WidgetType.choices)
    chart_type = models.CharField(max_length=15, choices=ChartType.choices, blank=True)
    
    # Data source
    data_source = models.TextField()  # SQL query or API endpoint
    refresh_interval = models.PositiveIntegerField(default=300)  # Seconds
    
    # Display settings
    width = models.PositiveIntegerField(default=6)  # Grid width (1-12)
    height = models.PositiveIntegerField(default=4)  # Grid height
    position_x = models.PositiveIntegerField(default=0)
    position_y = models.PositiveIntegerField(default=0)
    
    # Styling
    color_scheme = models.JSONField(default=list, blank=True)
    display_options = models.JSONField(default=dict, blank=True)
    
    # Access control
    is_public = models.BooleanField(default=False)
    allowed_roles = models.JSONField(default=list, blank=True)
    
    # Caching
    cached_data = models.JSONField(default=dict, blank=True)
    last_updated = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_dashboard_widgets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dashboard_widgets'
        verbose_name = 'Dashboard Widget'
        verbose_name_plural = 'Dashboard Widgets'
        ordering = ['position_y', 'position_x']

    def __str__(self):
        return self.name

    def needs_refresh(self):
        """Check if widget data needs refreshing"""
        if not self.last_updated:
            return True
        
        elapsed = timezone.now() - self.last_updated
        return elapsed.total_seconds() > self.refresh_interval

    def update_cache(self, data):
        """Update cached data"""
        self.cached_data = data
        self.last_updated = timezone.now()
        self.save()


class Analytics(models.Model):
    """Pre-calculated analytics data"""
    
    class MetricType(models.TextChoices):
        DAILY_REVENUE = "DAILY_REVENUE", "Daily Revenue"
        WEEKLY_REVENUE = "WEEKLY_REVENUE", "Weekly Revenue"
        MONTHLY_REVENUE = "MONTHLY_REVENUE", "Monthly Revenue"
        PRODUCT_UTILIZATION = "PRODUCT_UTILIZATION", "Product Utilization"
        CUSTOMER_LIFETIME_VALUE = "CUSTOMER_LIFETIME_VALUE", "Customer Lifetime Value"
        AVERAGE_RENTAL_DURATION = "AVERAGE_RENTAL_DURATION", "Average Rental Duration"
        OVERDUE_RATE = "OVERDUE_RATE", "Overdue Rate"
        PAYMENT_SUCCESS_RATE = "PAYMENT_SUCCESS_RATE", "Payment Success Rate"

    metric_type = models.CharField(max_length=30, choices=MetricType.choices)
    date = models.DateField()
    
    # Metric values
    value = models.DecimalField(max_digits=15, decimal_places=2)
    secondary_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Additional context
    entity_id = models.UUIDField(null=True, blank=True)  # Product, Customer, etc.
    entity_type = models.CharField(max_length=50, blank=True)  # 'product', 'customer', etc.
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics'
        verbose_name = 'Analytics'
        verbose_name_plural = 'Analytics'
        indexes = [
            models.Index(fields=['metric_type', 'date']),
            models.Index(fields=['entity_type', 'entity_id', 'date']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['metric_type', 'date', 'entity_id'],
                name='unique_metric_date_entity'
            )
        ]

    def __str__(self):
        return f"{self.metric_type} - {self.date}: {self.value}"


class ReportAccess(models.Model):
    """Track report access for auditing"""
    
    class ActionType(models.TextChoices):
        VIEW = "VIEW", "Viewed"
        DOWNLOAD = "DOWNLOAD", "Downloaded"
        SHARE = "SHARE", "Shared"
        DELETE = "DELETE", "Deleted"

    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='access_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    action_type = models.CharField(max_length=10, choices=ActionType.choices)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    accessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'report_access'
        verbose_name = 'Report Access'
        verbose_name_plural = 'Report Access'
        ordering = ['-accessed_at']

    def __str__(self):
        return f"{self.user.username} {self.action_type} {self.report.name}"

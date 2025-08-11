from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Report, ScheduledReport, Analytics, ReportAccess


@receiver(post_save, sender=Report)
def report_created(sender, instance, created, **kwargs):
    """Handle report creation"""
    if created:
        # Send report creation notification
        try:
            from apps.notifications.tasks import send_report_notification
            send_report_notification.delay(instance.id)
        except ImportError:
            pass


@receiver(pre_save, sender=Report)
def report_status_changed(sender, instance, **kwargs):
    """Handle report status changes"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Send status update notification
                if instance.status == Report.Status.COMPLETED:
                    try:
                        from apps.notifications.tasks import send_report_ready_notification
                        send_report_ready_notification.delay(instance.id)
                    except ImportError:
                        pass
                elif instance.status == Report.Status.FAILED:
                    try:
                        from apps.notifications.tasks import send_report_failed_notification
                        send_report_failed_notification.delay(instance.id)
                    except ImportError:
                        pass
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=ScheduledReport)
def scheduled_report_created(sender, instance, created, **kwargs):
    """Handle scheduled report creation"""
    if created:
        # Calculate next run time
        instance.calculate_next_run()
        
        # Send confirmation notification
        try:
            from apps.notifications.tasks import send_scheduled_report_notification
            send_scheduled_report_notification.delay(instance.id)
        except ImportError:
            pass


@receiver(pre_save, sender=ScheduledReport)
def scheduled_report_updated(sender, instance, **kwargs):
    """Handle scheduled report updates"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            
            # Recalculate next run if frequency changed
            if old_instance.frequency != instance.frequency or old_instance.schedule_time != instance.schedule_time:
                instance.calculate_next_run()
                
            # Send notification if status changed
            if old_instance.status != instance.status:
                try:
                    from apps.notifications.tasks import send_scheduled_report_status_update
                    send_scheduled_report_status_update.delay(instance.id, old_instance.status, instance.status)
                except ImportError:
                    pass
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=ReportAccess)
def report_accessed(sender, instance, created, **kwargs):
    """Handle report access logging"""
    if created:
        # Update report access analytics
        analytics_date = timezone.now().date()
        
        # Create or update analytics record
        analytics, created = Analytics.objects.get_or_create(
            metric_type=Analytics.MetricType.DAILY_REVENUE,  # Use appropriate metric
            date=analytics_date,
            entity_type='report',
            entity_id=instance.report.id,
            defaults={
                'value': 1,
                'metadata': {'access_count': 1}
            }
        )
        
        if not created:
            analytics.value += 1
            metadata = analytics.metadata or {}
            metadata['access_count'] = metadata.get('access_count', 0) + 1
            analytics.metadata = metadata
            analytics.save()


@receiver(post_save, sender=Analytics)
def analytics_calculated(sender, instance, created, **kwargs):
    """Handle analytics calculation completion"""
    if created:
        # Trigger dashboard widget refresh if needed
        from .models import DashboardWidget
        widgets = DashboardWidget.objects.filter(
            is_active=True,
            data_source__icontains=instance.metric_type
        )
        
        for widget in widgets:
            widget.last_updated = None  # Force refresh
            widget.save(update_fields=['last_updated'])

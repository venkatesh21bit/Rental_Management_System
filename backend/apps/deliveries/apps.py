from django.apps import AppConfig


class DeliveriesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.deliveries'
    verbose_name = 'Deliveries'
    
    def ready(self):
        # Import signal handlers when app is ready
        try:
            import apps.deliveries.signals
        except ImportError:
            pass

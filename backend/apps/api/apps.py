from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.api'
    verbose_name = 'API Management'
    
    def ready(self):
        # Import signal handlers when app is ready
        try:
            import apps.api.signals
        except ImportError:
            pass

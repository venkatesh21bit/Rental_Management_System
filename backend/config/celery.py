from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('rental_management')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat schedule for automated tasks
app.conf.beat_schedule = {
    'check-upcoming-pickups': {
        'task': 'apps.notifications.tasks.check_upcoming_pickups',
        'schedule': crontab(hour=9, minute=0),  # Run daily at 9:00 AM
    },
    'check-upcoming-returns': {
        'task': 'apps.notifications.tasks.check_upcoming_returns',
        'schedule': crontab(hour=9, minute=30),  # Run daily at 9:30 AM
    },
    'check-overdue-returns': {
        'task': 'apps.notifications.tasks.check_overdue_returns',
        'schedule': crontab(hour=10, minute=0),  # Run daily at 10:00 AM
    },
}

app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

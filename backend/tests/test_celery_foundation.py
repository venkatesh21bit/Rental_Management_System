# tests/test_celery_foundation.py - Basic Celery tests for foundation

import pytest
from django.test import TestCase, override_settings
from unittest.mock import patch, Mock
from celery import current_app
from django.conf import settings


@pytest.mark.celery
class CeleryFoundationTestCase(TestCase):
    """Test Celery foundation setup"""
    
    def test_celery_app_configured(self):
        """Test Celery app is properly configured"""
        # Test that Celery app exists
        self.assertIsNotNone(current_app)
        self.assertEqual(current_app.main, 'rental_management')
    
    def test_celery_settings(self):
        """Test Celery settings are configured"""
        # Check broker settings
        self.assertTrue(hasattr(settings, 'CELERY_BROKER_URL'))
        
        # Check that celery apps are installed
        celery_apps = [
            'django_celery_beat',
            'django_celery_results'
        ]
        
        for app in celery_apps:
            self.assertIn(app, settings.INSTALLED_APPS)
    
    def test_celery_beat_schedule(self):
        """Test Celery Beat schedule is configured"""
        from config.celery import app
        
        # Check beat schedule exists
        self.assertTrue(hasattr(app.conf, 'beat_schedule'))
        
        # Check for expected scheduled tasks
        beat_schedule = app.conf.beat_schedule
        expected_tasks = [
            'check-upcoming-pickups',
            'check-upcoming-returns', 
            'check-overdue-returns'
        ]
        
        for task_name in expected_tasks:
            self.assertIn(task_name, beat_schedule, f"Task {task_name} not in beat schedule")
    
    @patch('apps.notifications.tasks.send_email_notification.delay')
    def test_task_import(self, mock_task):
        """Test that Celery tasks can be imported"""
        try:
            from apps.notifications.tasks import (
                check_upcoming_pickups,
                check_upcoming_returns,
                check_overdue_returns,
                send_email_notification
            )
            
            # Test that tasks are callable
            self.assertTrue(callable(check_upcoming_pickups))
            self.assertTrue(callable(check_upcoming_returns))
            self.assertTrue(callable(check_overdue_returns))
            self.assertTrue(callable(send_email_notification))
            
        except ImportError as e:
            self.fail(f"Failed to import Celery tasks: {e}")
    
    def test_celery_worker_ready(self):
        """Test if Celery worker can be started (mock test)"""
        # This would test worker startup in a real environment
        # For now, just test that the configuration is valid
        from config.celery import app
        
        # Test that app can be configured
        self.assertIsInstance(app.conf.broker_url, str)
        self.assertIsInstance(app.conf.result_backend, str)


@pytest.mark.integration
class CeleryIntegrationTestCase(TestCase):
    """Integration tests for Celery with Django"""
    
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_django_orm_in_task(self):
        """Test Django ORM access in Celery task"""
        from apps.notifications.tasks import send_email_notification
        
        # Mock the actual email sending
        with patch('django.core.mail.send_mail') as mock_send:
            mock_send.return_value = True
            
            # Test task execution
            result = send_email_notification.delay(
                recipient='test@example.com',
                template_name='test_template',
                context={'test': 'data'}
            )
            
            # In eager mode, task should complete immediately
            self.assertTrue(result.successful())
    
    def test_celery_with_cache(self):
        """Test Celery works with Django cache"""
        from django.core.cache import cache
        
        # Test cache functionality (important for Celery task coordination)
        test_key = 'celery_test_key'
        test_value = 'celery_test_value'
        
        cache.set(test_key, test_value, 60)
        cached_value = cache.get(test_key)
        
        self.assertEqual(cached_value, test_value)
        
        # Cleanup
        cache.delete(test_key)


# Performance test for Celery
@pytest.mark.slow
class CeleryPerformanceTestCase(TestCase):
    """Performance tests for Celery setup"""
    
    def test_task_registration_time(self):
        """Test that task registration doesn't take too long"""
        import time
        
        start_time = time.time()
        
        # Import tasks (this triggers registration)
        from apps.notifications import tasks
        
        end_time = time.time()
        registration_time = end_time - start_time
        
        # Should register in less than 1 second
        self.assertLess(registration_time, 1.0, "Task registration took too long")


# Mock Celery worker for testing
class MockCeleryWorker:
    """Mock Celery worker for testing"""
    
    def __init__(self):
        self.tasks = []
        self.running = False
    
    def start(self):
        """Start mock worker"""
        self.running = True
        return True
    
    def stop(self):
        """Stop mock worker"""
        self.running = False
        return True
    
    def add_task(self, task_name, *args, **kwargs):
        """Add task to mock worker"""
        self.tasks.append({
            'name': task_name,
            'args': args, 
            'kwargs': kwargs,
            'status': 'pending'
        })
    
    def execute_pending_tasks(self):
        """Execute all pending tasks"""
        for task in self.tasks:
            if task['status'] == 'pending':
                task['status'] = 'completed'
        return len([t for t in self.tasks if t['status'] == 'completed'])


def test_celery_foundation_ready():
    """Test that Celery foundation is ready for production"""
    
    # Check required components
    requirements = [
        'config.celery',
        'apps.notifications.tasks',
        'django_celery_beat',
        'django_celery_results',
    ]
    
    missing_components = []
    
    for requirement in requirements:
        try:
            __import__(requirement)
        except ImportError:
            missing_components.append(requirement)
    
    assert len(missing_components) == 0, f"Missing Celery components: {missing_components}"
    
    print("✅ Celery foundation is ready!")


if __name__ == '__main__':
    # Run when executed directly
    test_celery_foundation_ready()

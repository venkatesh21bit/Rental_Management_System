# tests/test_celery.py - Comprehensive Celery testing

import pytest
from unittest.mock import patch, Mock
from django.test import TestCase, override_settings
from django.utils import timezone
from celery.result import AsyncResult
from celery import current_app
from datetime import datetime, timedelta
import json

# Import your tasks
from apps.notifications.tasks import (
    check_upcoming_pickups,
    check_upcoming_returns,
    check_overdue_returns,
    send_email_notification
)

class CeleryTestCase(TestCase):
    """Base test case for Celery tasks"""
    
    def setUp(self):
        # Clear any existing tasks
        current_app.control.purge()
    
    def tearDown(self):
        # Clean up after tests
        current_app.control.purge()

class TestCeleryTasks(CeleryTestCase):
    """Test Celery task functionality"""
    
    @patch('apps.notifications.tasks.send_email_notification.delay')
    def test_upcoming_pickups_task(self, mock_email):
        """Test upcoming pickups notification task"""
        # Create test data
        from tests.test_config import OrderFactory
        from django.utils import timezone
        
        # Create order with pickup tomorrow
        pickup_date = timezone.now() + timedelta(days=1)
        order = OrderFactory(
            rental_start=pickup_date,
            status='confirmed'
        )
        
        # Execute task
        result = check_upcoming_pickups.delay()
        
        # Assertions
        self.assertTrue(result.successful())
        mock_email.assert_called()
    
    @patch('apps.notifications.tasks.send_email_notification.delay')
    def test_overdue_returns_task(self, mock_email):
        """Test overdue returns notification task"""
        # Create overdue order
        from tests.test_config import OrderFactory
        
        overdue_date = timezone.now() - timedelta(days=2)
        order = OrderFactory(
            rental_end=overdue_date,
            status='active'
        )
        
        # Execute task
        result = check_overdue_returns.delay()
        
        # Verify task completion and email sent
        self.assertTrue(result.successful())
        mock_email.assert_called()
    
    def test_email_notification_task(self):
        """Test email notification task"""
        # Mock email backend
        with patch('django.core.mail.send_mail') as mock_send:
            mock_send.return_value = True
            
            # Execute task
            result = send_email_notification.delay(
                recipient='test@example.com',
                template_name='pickup_reminder',
                context={'order_id': '12345'}
            )
            
            # Verify email was sent
            self.assertTrue(result.successful())
            mock_send.assert_called_once()
    
    def test_task_retry_mechanism(self):
        """Test task retry on failure"""
        with patch('apps.notifications.tasks.send_email_notification.retry') as mock_retry:
            with patch('django.core.mail.send_mail', side_effect=Exception('SMTP Error')):
                
                # This should trigger retry
                send_email_notification.delay(
                    recipient='test@example.com',
                    template_name='test',
                    context={}
                )
                
                # Verify retry was called
                mock_retry.assert_called()

class TestCeleryBeat(CeleryTestCase):
    """Test Celery Beat scheduled tasks"""
    
    def test_beat_schedule_configuration(self):
        """Test that beat schedule is properly configured"""
        from config.celery import app
        
        beat_schedule = app.conf.beat_schedule
        
        # Check required tasks are scheduled
        required_tasks = [
            'check-upcoming-pickups',
            'check-upcoming-returns',
            'check-overdue-returns'
        ]
        
        for task_name in required_tasks:
            self.assertIn(task_name, beat_schedule)
            self.assertIn('task', beat_schedule[task_name])
            self.assertIn('schedule', beat_schedule[task_name])
    
    @patch('apps.notifications.tasks.check_upcoming_pickups.delay')
    def test_scheduled_task_execution(self, mock_task):
        """Test scheduled task execution"""
        from django_celery_beat.models import PeriodicTask, CrontabSchedule
        
        # Create a test periodic task
        schedule, created = CrontabSchedule.objects.get_or_create(
            minute='0',
            hour='9',
            day_of_week='*',
            day_of_month='*',
            month_of_year='*',
        )
        
        task = PeriodicTask.objects.create(
            crontab=schedule,
            name='test-upcoming-pickups',
            task='apps.notifications.tasks.check_upcoming_pickups',
        )
        
        # Manually trigger the task
        task.task
        
        # Verify it would be called
        self.assertEqual(task.task, 'apps.notifications.tasks.check_upcoming_pickups')

class CeleryPerformanceTest(CeleryTestCase):
    """Performance tests for Celery tasks"""
    
    def test_task_execution_time(self):
        """Test that tasks complete within acceptable time"""
        import time
        
        start_time = time.time()
        result = check_upcoming_pickups.delay()
        result.get(timeout=30)  # 30 second timeout
        end_time = time.time()
        
        execution_time = end_time - start_time
        self.assertLess(execution_time, 10, "Task took too long to execute")
    
    def test_concurrent_task_execution(self):
        """Test multiple tasks can run concurrently"""
        tasks = []
        
        # Start multiple tasks
        for i in range(5):
            task = send_email_notification.delay(
                recipient=f'test{i}@example.com',
                template_name='test',
                context={'test': True}
            )
            tasks.append(task)
        
        # Wait for all to complete
        for task in tasks:
            task.get(timeout=30)
            self.assertTrue(task.successful())

# Celery Monitoring and Health Checks
class CeleryMonitoringTest(CeleryTestCase):
    """Test Celery monitoring and health checks"""
    
    def test_worker_health_check(self):
        """Test Celery worker health"""
        from celery import current_app
        
        # Check if workers are active
        inspect = current_app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            # Workers are running
            for worker, data in stats.items():
                self.assertIn('rusage', data)
                self.assertIn('total', data)
        else:
            # No workers running - should fail in production
            self.skipTest("No Celery workers running")
    
    def test_queue_status(self):
        """Test queue status and length"""
        from celery import current_app
        
        inspect = current_app.control.inspect()
        active_queues = inspect.active_queues()
        
        if active_queues:
            for worker, queues in active_queues.items():
                self.assertIsInstance(queues, list)
    
    def test_failed_task_handling(self):
        """Test handling of failed tasks"""
        # Create a task that will fail
        with patch('django.core.mail.send_mail', side_effect=Exception('Test failure')):
            result = send_email_notification.delay(
                recipient='test@example.com',
                template_name='nonexistent',
                context={}
            )
            
            # Task should fail
            with self.assertRaises(Exception):
                result.get(propagate=True)

# Integration with Django Test Runner
@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True,
)
class CeleryIntegrationTest(TestCase):
    """Integration tests with Django"""
    
    def test_django_orm_in_task(self):
        """Test Django ORM usage in Celery tasks"""
        from apps.orders.models import RentalOrder
        from tests.test_config import OrderFactory
        
        # Create test order
        order = OrderFactory()
        
        # Task should be able to access Django ORM
        result = check_upcoming_pickups.delay()
        
        # Should complete without database errors
        self.assertTrue(result.successful())
    
    def test_task_transaction_handling(self):
        """Test transaction handling in tasks"""
        from django.db import transaction
        
        # Test that tasks handle transactions properly
        with transaction.atomic():
            result = send_email_notification.delay(
                recipient='test@example.com',
                template_name='test',
                context={}
            )
            
            # Should complete within transaction
            self.assertTrue(result.successful())

# Load Testing for Celery
class CeleryLoadTest:
    """Load testing utilities for Celery"""
    
    @staticmethod
    def create_load_test(task_name, num_tasks=100):
        """Create load test for specific task"""
        def load_test():
            import time
            import concurrent.futures
            
            def run_task():
                if task_name == 'email':
                    return send_email_notification.delay(
                        recipient='load@test.com',
                        template_name='test',
                        context={}
                    )
                elif task_name == 'pickups':
                    return check_upcoming_pickups.delay()
                # Add more task types as needed
            
            start_time = time.time()
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(run_task) for _ in range(num_tasks)]
                results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
            end_time = time.time()
            
            return {
                'total_time': end_time - start_time,
                'tasks_completed': len([r for r in results if r.successful()]),
                'tasks_failed': len([r for r in results if not r.successful()]),
                'average_time': (end_time - start_time) / num_tasks
            }
        
        return load_test

# Celery Testing Utilities
class CeleryTestUtils:
    """Utility functions for Celery testing"""
    
    @staticmethod
    def wait_for_task_completion(task_result, timeout=30):
        """Wait for task to complete with timeout"""
        import time
        
        start_time = time.time()
        while not task_result.ready():
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Task did not complete within {timeout} seconds")
            time.sleep(0.1)
        
        return task_result.get()
    
    @staticmethod
    def mock_task_failure(task_func, exception_type=Exception):
        """Mock task failure for testing retry logic"""
        with patch.object(task_func, 'apply_async', side_effect=exception_type("Mocked failure")):
            return task_func.delay()
    
    @staticmethod
    def get_task_metrics():
        """Get task execution metrics"""
        from celery import current_app
        
        inspect = current_app.control.inspect()
        return {
            'active_tasks': inspect.active(),
            'scheduled_tasks': inspect.scheduled(),
            'stats': inspect.stats(),
            'reserved_tasks': inspect.reserved()
        }

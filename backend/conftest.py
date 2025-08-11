# conftest.py - Pytest configuration and fixtures

import os
import sys
import django
from django.conf import settings

# Configure Django settings for pytest FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Now we can safely import Django components
from django.test.utils import get_runner
from rest_framework.test import APIClient
from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()

# Import pytest fixtures
import pytest

@pytest.fixture
def api_client():
    """Provide an API client for testing"""
    return APIClient()

@pytest.fixture  
def client():
    """Provide a Django test client"""
    return Client()

@pytest.fixture
def user():
    """Create a test user"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

@pytest.fixture
def authenticated_client(api_client, user):
    """Provide an authenticated API client"""
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def staff_user():
    """Create a staff user"""
    return User.objects.create_user(
        username='staffuser',
        email='staff@example.com', 
        password='staffpass123',
        is_staff=True
    )

@pytest.fixture
def superuser():
    """Create a superuser"""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123'
    )

# Database setup for tests
@pytest.fixture(scope='session')
def django_db_setup():
    """Set up test database"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }

# Custom markers
def pytest_collection_modifyitems(config, items):
    """Add custom markers to tests"""
    for item in items:
        # Mark slow tests
        if 'slow' in item.nodeid:
            item.add_marker(pytest.mark.slow)
        
        # Mark integration tests  
        if 'integration' in item.nodeid:
            item.add_marker(pytest.mark.integration)
        
        # Mark API tests
        if 'api' in item.nodeid or 'test_api' in item.name:
            item.add_marker(pytest.mark.api)

# Test data fixtures
@pytest.fixture
def sample_product_data():
    """Sample product data for testing"""
    return {
        'name': 'Test Product',
        'description': 'A test product for testing',
        'daily_rate': '50.00',
        'is_active': True,
    }

@pytest.fixture
def sample_order_data():
    """Sample order data for testing"""
    return {
        'rental_start': '2024-08-15',
        'rental_end': '2024-08-20',
        'status': 'pending',
    }

# Mock fixtures for external services
@pytest.fixture
def mock_redis():
    """Mock Redis for testing"""
    try:
        import fakeredis
        return fakeredis.FakeStrictRedis()
    except ImportError:
        # If fakeredis not available, use a simple mock
        from unittest.mock import Mock
        return Mock()

@pytest.fixture
def mock_email_backend():
    """Mock email backend for testing"""
    from unittest.mock import patch
    with patch('django.core.mail.send_mail') as mock_send:
        mock_send.return_value = True
        yield mock_send

# Performance testing fixtures
@pytest.fixture
def benchmark_timer():
    """Timer for performance testing"""
    import time
    
    class Timer:
        def __init__(self):
            self.start_time = None
            self.end_time = None
        
        def start(self):
            self.start_time = time.time()
        
        def stop(self):
            self.end_time = time.time()
        
        @property
        def elapsed(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None
    
    return Timer()

# Test environment setup
@pytest.fixture(autouse=True)
def setup_test_environment(settings):
    """Set up test environment automatically"""
    # Disable migrations for faster testing
    settings.MIGRATION_MODULES = {
        'accounts': None,
        'catalog': None,
        'orders': None,
        'deliveries': None,
        'invoicing': None,
        'payments': None,
        'notifications': None,
        'reports': None,
    }
    
    # Use in-memory cache for testing
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
    
    # Use console email backend for testing
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    
    # Disable throttling for tests
    settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
        'anon': '1000/hour',
        'user': '10000/hour', 
        'login': '100/minute',
        'password_reset': '100/hour',
    }

# Cleanup fixtures
@pytest.fixture
def cleanup_files():
    """Clean up files after test"""
    files_to_cleanup = []
    
    def add_file(filepath):
        files_to_cleanup.append(filepath)
    
    yield add_file
    
    # Cleanup
    import os
    for filepath in files_to_cleanup:
        if os.path.exists(filepath):
            os.remove(filepath)

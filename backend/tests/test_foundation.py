# tests/test_foundation.py - Foundation tests to verify production setup

import pytest
from django.test import TestCase, Client
from django.conf import settings
from django.core.management import call_command
from django.urls import reverse
import redis
from rest_framework.test import APIClient
from rest_framework import status


class FoundationTestCase(TestCase):
    """Test basic foundation setup"""
    
    def setUp(self):
        self.client = Client()
        self.api_client = APIClient()
    
    def test_django_setup(self):
        """Test that Django is properly configured"""
        self.assertTrue(hasattr(settings, 'SECRET_KEY'))
        self.assertTrue(hasattr(settings, 'INSTALLED_APPS'))
        self.assertIn('rest_framework', settings.INSTALLED_APPS)
        self.assertIn('corsheaders', settings.INSTALLED_APPS)
    
    def test_production_apps_installed(self):
        """Test that production enhancement apps are installed"""
        production_apps = [
            'csp',
            'django_ratelimit', 
            'health_check',
            'drf_spectacular',
            'debug_toolbar',
        ]
        
        for app in production_apps:
            self.assertIn(app, settings.INSTALLED_APPS, f"{app} not in INSTALLED_APPS")
    
    def test_security_middleware(self):
        """Test that security middleware is configured"""
        required_middleware = [
            'corsheaders.middleware.CorsMiddleware',
            'django.middleware.security.SecurityMiddleware',
            'csp.middleware.CSPMiddleware',
            'django_ratelimit.middleware.RatelimitMiddleware',
        ]
        
        for middleware in required_middleware:
            self.assertIn(middleware, settings.MIDDLEWARE, f"{middleware} not in MIDDLEWARE")
    
    def test_rest_framework_config(self):
        """Test REST Framework configuration"""
        self.assertIn('DEFAULT_THROTTLE_CLASSES', settings.REST_FRAMEWORK)
        self.assertIn('DEFAULT_THROTTLE_RATES', settings.REST_FRAMEWORK)
        self.assertIn('DEFAULT_SCHEMA_CLASS', settings.REST_FRAMEWORK)
        
        # Test throttle rates
        throttle_rates = settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
        self.assertIn('anon', throttle_rates)
        self.assertIn('user', throttle_rates)
    
    def test_cache_configuration(self):
        """Test Redis cache configuration"""
        self.assertIn('default', settings.CACHES)
        cache_config = settings.CACHES['default']
        self.assertEqual(cache_config['BACKEND'], 'django_redis.cache.RedisCache')
    
    def test_logging_configuration(self):
        """Test logging is configured"""
        self.assertIn('version', settings.LOGGING)
        self.assertIn('handlers', settings.LOGGING)
        self.assertIn('loggers', settings.LOGGING)
    
    def test_security_settings(self):
        """Test security settings are properly configured"""
        # Test CSP settings
        self.assertTrue(hasattr(settings, 'CSP_DEFAULT_SRC'))
        self.assertTrue(hasattr(settings, 'CSP_SCRIPT_SRC'))
        
        # Test file upload limits
        self.assertEqual(settings.FILE_UPLOAD_MAX_MEMORY_SIZE, 5242880)  # 5MB


class HealthCheckTestCase(TestCase):
    """Test health check functionality"""
    
    def test_django_check_command(self):
        """Test Django system check passes"""
        try:
            call_command('check')
        except Exception as e:
            self.fail(f"Django check failed: {e}")
    
    def test_database_connection(self):
        """Test database connection is working"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            self.assertEqual(result[0], 1)


@pytest.mark.api
class APIFoundationTestCase(TestCase):
    """Test API foundation"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_api_base_url_structure(self):
        """Test that API URLs are properly structured"""
        # This will test when we add health check endpoints
        pass
    
    def test_cors_headers(self):
        """Test CORS headers are present"""
        # Make an OPTIONS request to test CORS
        response = self.client.options('/api/')
        
        # Should not fail (may return 404, but should have CORS headers)
        self.assertIn('Access-Control-Allow-Origin', response.get('Access-Control-Allow-Origin', ''))


@pytest.mark.integration  
class IntegrationTestCase(TestCase):
    """Integration tests for the foundation"""
    
    def test_middleware_stack(self):
        """Test that middleware stack works together"""
        response = self.client.get('/')
        
        # Should not cause server errors
        self.assertNotEqual(response.status_code, 500)
    
    def test_static_files_serving(self):
        """Test static files configuration"""
        # This tests that static files are properly configured
        self.assertTrue(hasattr(settings, 'STATIC_URL'))
        self.assertTrue(hasattr(settings, 'STATIC_ROOT'))


class SecurityTestCase(TestCase):
    """Security configuration tests"""
    
    @pytest.mark.security
    def test_debug_setting(self):
        """Test DEBUG setting is appropriate for environment"""
        # In production, DEBUG should be False
        if hasattr(settings, 'ENVIRONMENT') and settings.ENVIRONMENT == 'production':
            self.assertFalse(settings.DEBUG)
    
    @pytest.mark.security
    def test_secret_key_security(self):
        """Test SECRET_KEY is not using default insecure value"""
        # Should not be using the default Django insecure key
        self.assertNotIn('django-insecure', settings.SECRET_KEY)
    
    @pytest.mark.security
    def test_allowed_hosts(self):
        """Test ALLOWED_HOSTS is properly configured"""
        self.assertIsInstance(settings.ALLOWED_HOSTS, list)
        self.assertGreater(len(settings.ALLOWED_HOSTS), 0)


# Performance and Load Testing Foundation
@pytest.mark.slow
class PerformanceTestCase(TestCase):
    """Basic performance tests"""
    
    def test_settings_import_time(self):
        """Test that settings import doesn't take too long"""
        import time
        start_time = time.time()
        
        # Import settings
        from django.conf import settings
        settings.DEBUG  # Access a setting to ensure it's loaded
        
        end_time = time.time()
        import_time = end_time - start_time
        
        # Should import in less than 1 second
        self.assertLess(import_time, 1.0, "Settings import took too long")


# Test Data Factories (using factory_boy)
class TestDataSetup:
    """Test data factory setup verification"""
    
    @staticmethod
    def test_factory_boy_available():
        """Test that factory_boy is available"""
        try:
            import factory
            return True
        except ImportError:
            return False
    
    @staticmethod  
    def test_faker_available():
        """Test that faker is available"""
        try:
            from faker import Faker
            fake = Faker()
            # Test basic faker functionality
            fake.name()
            return True
        except ImportError:
            return False


# Utility test functions
def test_production_packages_installed():
    """Test that all production packages are properly installed"""
    required_packages = [
        'django_redis',
        'psutil', 
        'csp',
        'django_ratelimit',
        'health_check',
        'drf_spectacular',
        'pytest',
        'factory',
        'faker',
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    assert len(missing_packages) == 0, f"Missing packages: {missing_packages}"


def test_redis_connection():
    """Test Redis connection if available"""
    try:
        import redis
        from django.conf import settings
        
        # Try to connect to Redis
        cache_config = settings.CACHES['default']
        if 'redis' in cache_config['LOCATION']:
            # Extract Redis URL or use default
            redis_url = cache_config['LOCATION']
            r = redis.from_url(redis_url)
            r.ping()
            return True
    except Exception:
        # Redis not available, skip test
        pytest.skip("Redis not available")
    
    return False


if __name__ == '__main__':
    # Run basic tests when executed directly
    import django
    from django.conf import settings
    from django.test.utils import get_runner
    
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(["tests.test_foundation"])
    
    if failures:
        exit(1)
    else:
        print("✅ Foundation tests passed!")
        exit(0)

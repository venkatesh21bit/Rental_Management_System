# tests/test_config.py - Comprehensive testing configuration

import pytest
from django.test import TestCase, TransactionTestCase
from django.test.utils import override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, Mock
import factory
from factory.django import DjangoModelFactory
from decimal import Decimal
import tempfile
import os

User = get_user_model()

# Test Settings
TEST_DATABASE = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'OPTIONS': {
            'timeout': 20,
        }
    }
}

# Factory Classes for Test Data
class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@test.com")
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_active = True

class CustomerFactory(DjangoModelFactory):
    class Meta:
        model = 'accounts.UserProfile'
    
    user = factory.SubFactory(UserFactory)
    phone_number = factory.Faker('phone_number')
    user_type = 'customer'

class ProductFactory(DjangoModelFactory):
    class Meta:
        model = 'catalog.Product'
    
    name = factory.Faker('word')
    description = factory.Faker('text')
    daily_rate = factory.Faker('pydecimal', left_digits=3, right_digits=2, positive=True)
    category = factory.SubFactory('tests.factories.CategoryFactory')

class OrderFactory(DjangoModelFactory):
    class Meta:
        model = 'orders.RentalOrder'
    
    customer = factory.SubFactory(CustomerFactory)
    status = 'pending'
    total_amount = factory.Faker('pydecimal', left_digits=4, right_digits=2, positive=True)

# Base Test Classes
class BaseTestCase(TestCase):
    """Base test class with common setup"""
    
    def setUp(self):
        self.user = UserFactory()
        self.client = APIClient()
    
    def authenticate_user(self, user=None):
        """Helper to authenticate a user"""
        if user is None:
            user = self.user
        self.client.force_authenticate(user=user)
    
    def create_test_file(self, content="test content", name="test.txt"):
        """Helper to create test files"""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=name)
        temp_file.write(content.encode())
        temp_file.close()
        return temp_file.name

class APITestBase(APITestCase):
    """Base API test class"""
    
    def setUp(self):
        self.user = UserFactory()
        self.customer = CustomerFactory(user=self.user)
        self.client = APIClient()
    
    def get_auth_headers(self, user=None):
        """Get JWT auth headers"""
        if user is None:
            user = self.user
        
        response = self.client.post('/api/auth/login/', {
            'email': user.email,
            'password': 'testpass123'
        })
        token = response.data.get('access_token')
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

# Performance Test Mixins
class PerformanceTestMixin:
    """Mixin for performance testing"""
    
    def assertQueryCountLessThan(self, max_queries, func, *args, **kwargs):
        """Assert that function executes with fewer than max_queries"""
        with self.assertNumQueries(0, max_queries):
            return func(*args, **kwargs)
    
    def measure_response_time(self, url, method='GET', **kwargs):
        """Measure API response time"""
        import time
        start_time = time.time()
        
        if method == 'GET':
            response = self.client.get(url, **kwargs)
        elif method == 'POST':
            response = self.client.post(url, **kwargs)
        # Add other methods as needed
        
        end_time = time.time()
        response_time = end_time - start_time
        
        return response, response_time

# Security Test Mixins
class SecurityTestMixin:
    """Mixin for security testing"""
    
    def test_unauthorized_access(self, url, method='GET'):
        """Test that unauthorized users can't access protected endpoints"""
        self.client.logout()
        
        if method == 'GET':
            response = self.client.get(url)
        elif method == 'POST':
            response = self.client.post(url)
        
        self.assertIn(response.status_code, [401, 403])
    
    def test_sql_injection(self, url, param_name):
        """Basic SQL injection test"""
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users--"
        ]
        
        for malicious_input in malicious_inputs:
            response = self.client.get(url, {param_name: malicious_input})
            # Should not return 500 or expose database errors
            self.assertNotEqual(response.status_code, 500)
    
    def test_xss_protection(self, url, param_name):
        """Basic XSS protection test"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "';alert('XSS');//"
        ]
        
        for payload in xss_payloads:
            response = self.client.get(url, {param_name: payload})
            # Response should escape or sanitize the payload
            self.assertNotIn(payload, response.content.decode())

# Integration Test Base
class IntegrationTestBase(TransactionTestCase):
    """Base class for integration tests"""
    
    def setUp(self):
        self.user = UserFactory()
        self.client = APIClient()
    
    @patch('apps.notifications.tasks.send_email_notification.delay')
    def test_email_notifications(self, mock_email):
        """Test email notification integration"""
        # Test implementation
        pass
    
    @patch('apps.payments.services.StripeService.create_payment_intent')
    def test_payment_integration(self, mock_stripe):
        """Test payment gateway integration"""
        # Test implementation
        pass

# Custom Assertions
class CustomAssertions:
    """Custom assertion methods"""
    
    def assertValidJSON(self, response):
        """Assert response contains valid JSON"""
        try:
            response.json()
        except ValueError:
            self.fail("Response does not contain valid JSON")
    
    def assertValidPagination(self, response_data):
        """Assert response contains valid pagination"""
        self.assertIn('pagination', response_data)
        pagination = response_data['pagination']
        required_fields = ['total', 'page', 'total_pages', 'has_next', 'has_prev']
        for field in required_fields:
            self.assertIn(field, pagination)
    
    def assertValidTimestamp(self, timestamp_str):
        """Assert string is valid ISO timestamp"""
        from django.utils.dateparse import parse_datetime
        parsed = parse_datetime(timestamp_str)
        self.assertIsNotNone(parsed)

# Test Data Builders
class TestDataBuilder:
    """Builder pattern for test data"""
    
    @staticmethod
    def create_complete_order():
        """Create a complete order with all related objects"""
        customer = CustomerFactory()
        product = ProductFactory()
        order = OrderFactory(customer=customer)
        # Add order items, payments, etc.
        return order
    
    @staticmethod
    def create_test_scenario(name):
        """Create predefined test scenarios"""
        scenarios = {
            'overdue_rental': lambda: TestDataBuilder._create_overdue_rental(),
            'upcoming_pickup': lambda: TestDataBuilder._create_upcoming_pickup(),
            'payment_failure': lambda: TestDataBuilder._create_payment_failure(),
        }
        return scenarios.get(name, lambda: None)()
    
    @staticmethod
    def _create_overdue_rental():
        # Implementation for overdue rental scenario
        pass

# Load Testing Utilities
class LoadTestConfig:
    """Configuration for load testing"""
    
    CONCURRENT_USERS = 50
    TEST_DURATION = 300  # 5 minutes
    RAMP_UP_TIME = 60   # 1 minute
    
    API_ENDPOINTS = [
        '/api/catalog/products/',
        '/api/orders/',
        '/api/auth/login/',
        '/api/accounts/profile/',
    ]
    
    @staticmethod
    def generate_load_test_script():
        """Generate locust load test script"""
        script = """
from locust import HttpUser, task, between

class RentalSystemUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/api/auth/login/", {
            "email": "test@example.com",
            "password": "testpass123"
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})
    
    @task(3)
    def browse_products(self):
        self.client.get("/api/catalog/products/")
    
    @task(2)
    def view_orders(self):
        self.client.get("/api/orders/")
    
    @task(1)
    def view_profile(self):
        self.client.get("/api/accounts/profile/")
        """
        return script

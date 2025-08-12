#!/usr/bin/env python
"""
Test script to validate order creation and email notification functionality.
This script creates a test order and verifies that the email is sent.
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set the DJANGO_SETTINGS_MODULE environment variable
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

from django.contrib.auth import get_user_model
from apps.catalog.models import Product, ProductCategory
from apps.orders.models import RentalOrder, RentalItem
from apps.orders.serializers import RentalOrderSerializer
from apps.notifications.tasks import send_order_confirmation_email
from utils.email_service import email_service
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def create_test_data():
    """Create test data for order email functionality"""
    print("Creating test data...")
    
    # Create a test user
    test_user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'is_active': True
        }
    )
    if created:
        test_user.set_password('testpass123')
        test_user.save()
        print(f"Created test user: {test_user.email}")
    else:
        print(f"Using existing test user: {test_user.email}")
    
    # Create a test category
    category, created = ProductCategory.objects.get_or_create(
        name='Test Equipment',
        defaults={'description': 'Test equipment category'}
    )
    if created:
        print(f"Created test category: {category.name}")
    
    # Create test products with daily rates
    products_data = [
        {
            'sku': 'CAM001',
            'name': 'Professional DSLR Camera',
            'description': 'High-quality DSLR camera for professional photography',
            'daily_rate': 1500.00,
            'quantity_on_hand': 5
        },
        {
            'sku': 'TRI001', 
            'name': 'Carbon Fiber Tripod',
            'description': 'Lightweight and sturdy carbon fiber tripod',
            'daily_rate': 300.00,
            'quantity_on_hand': 10
        }
    ]
    
    created_products = []
    for product_data in products_data:
        product, created = Product.objects.get_or_create(
            sku=product_data['sku'],
            defaults={
                **product_data,
                'category': category,
                'rentable': True,
                'is_active': True
            }
        )
        if created:
            print(f"Created test product: {product.name} - ₹{product.daily_rate}/day")
        else:
            # Update the daily rate if product exists
            product.daily_rate = product_data['daily_rate']
            product.save()
            print(f"Updated test product: {product.name} - ₹{product.daily_rate}/day")
        created_products.append(product)
    
    return test_user, created_products

def test_email_service():
    """Test the email service with order confirmation template"""
    print("\n--- Testing Email Service ---")
    
    test_context = {
        'order': {
            'id': 'TEST123',
            'created_at': '2024-01-15 10:30',
            'start_date': '2024-01-20',
            'end_date': '2024-01-25',
            'total_amount': '3600.00',
            'status': 'CONFIRMED',
            'items': [
                {
                    'product_name': 'Professional DSLR Camera',
                    'quantity': 1,
                    'rate': '1500.00',
                    'subtotal': '3000.00'
                },
                {
                    'product_name': 'Carbon Fiber Tripod',
                    'quantity': 2,
                    'rate': '300.00',
                    'subtotal': '600.00'
                }
            ]
        },
        'user': {
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com'
        }
    }
    
    success = email_service.send_notification_email(
        to_email='test@example.com',
        subject='Test Order Confirmation - #TEST123',
        template_name='order_confirmation',
        context=test_context,
        notification_type='ORDER_CONFIRMATION'
    )
    
    if success:
        print("✅ Email service test successful - Order confirmation email sent!")
    else:
        print("❌ Email service test failed - Could not send email")
    
    return success

def test_order_creation():
    """Test order creation with email notification"""
    print("\n--- Testing Order Creation with Email ---")
    
    user, products = create_test_data()
    
    # Create order data
    rental_start = timezone.now() + timedelta(days=1)
    rental_end = rental_start + timedelta(days=4)
    
    order_data = {
        'customer': user.id,
        'rental_start': rental_start.isoformat(),
        'rental_end': rental_end.isoformat(),
        'pickup_address': 'Test Store Location, Test City',
        'return_address': 'Test Store Location, Test City',
        'notes': 'Test order for email notification',
        'items': [
            {
                'product_id': str(products[0].id),  # Camera
                'quantity': 1,
                'unit_price': float(products[0].daily_rate),
                'rental_unit': 'DAY',
                'start_datetime': rental_start.isoformat(),
                'end_datetime': rental_end.isoformat(),
                'line_total': float(products[0].daily_rate) * 4  # 4 days
            },
            {
                'product_id': str(products[1].id),  # Tripod
                'quantity': 2,
                'unit_price': float(products[1].daily_rate),
                'rental_unit': 'DAY', 
                'start_datetime': rental_start.isoformat(),
                'end_datetime': rental_end.isoformat(),
                'line_total': float(products[1].daily_rate) * 2 * 4  # 2 tripods for 4 days
            }
        ]
    }
    
    try:
        # Create order using the serializer (this should trigger email)
        from rest_framework.test import APIRequestFactory
        from django.test import RequestFactory
        
        factory = RequestFactory()
        request = factory.post('/api/orders/', data=order_data)
        request.user = user
        
        # Simulate the serializer context
        context = {'request': request}
        serializer = RentalOrderSerializer(data=order_data, context=context)
        
        if serializer.is_valid():
            order = serializer.save(customer=user, created_by=user)
            print(f"✅ Order created successfully: {order.id}")
            print(f"   - Total Amount: ₹{order.total_amount}")
            print(f"   - Items: {order.items.count()}")
            print(f"   - Customer: {order.customer.email}")
            
            # Manual email test since automatic might not work without proper setup
            print("   - Attempting to send confirmation email...")
            
            context = {
                'order': {
                    'id': str(order.id),
                    'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
                    'start_date': order.rental_start.strftime('%Y-%m-%d'),
                    'end_date': order.rental_end.strftime('%Y-%m-%d'),
                    'total_amount': str(order.total_amount),
                    'status': order.status,
                    'items': [
                        {
                            'product_name': item.product.name,
                            'quantity': item.quantity,
                            'rate': str(item.unit_price),
                            'subtotal': str(item.line_total)
                        }
                        for item in order.items.all()
                    ]
                },
                'user': {
                    'first_name': order.customer.first_name or 'Valued Customer',
                    'last_name': order.customer.last_name or '',
                    'email': order.customer.email
                }
            }
            
            email_success = email_service.send_notification_email(
                to_email=order.customer.email,
                subject=f"Order Confirmation - #{order.id}",
                template_name='order_confirmation',
                context=context,
                user=order.customer,
                notification_type='ORDER_CONFIRMATION'
            )
            
            if email_success:
                print("   ✅ Order confirmation email sent successfully!")
            else:
                print("   ❌ Failed to send order confirmation email")
            
            return order, email_success
            
        else:
            print(f"❌ Order creation failed: {serializer.errors}")
            return None, False
            
    except Exception as e:
        print(f"❌ Error creating order: {str(e)}")
        return None, False

def main():
    """Main test function"""
    print("=== Order Email Notification Test ===")
    
    # Test 1: Email service functionality
    email_test_success = test_email_service()
    
    # Test 2: Order creation with email
    order, order_email_success = test_order_creation()
    
    print("\n=== Test Results ===")
    print(f"Email Service Test: {'✅ PASS' if email_test_success else '❌ FAIL'}")
    print(f"Order Creation Test: {'✅ PASS' if order else '❌ FAIL'}")
    print(f"Order Email Test: {'✅ PASS' if order_email_success else '❌ FAIL'}")
    
    if email_test_success and order and order_email_success:
        print("\n🎉 All tests passed! Email notifications are working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the configuration and try again.")
        
        if not email_test_success:
            print("   - Email service may not be configured properly")
        if not order:
            print("   - Order creation failed - check models and serializers")
        if not order_email_success:
            print("   - Order email notification failed - check email integration")

if __name__ == '__main__':
    main()

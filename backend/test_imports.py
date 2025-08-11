#!/usr/bin/env python
"""Test script to verify all imports work correctly"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
    print("✅ Django setup successful")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)

# Test imports from notifications tasks
try:
    from apps.orders.models import RentalOrder
    print("✅ RentalOrder import successful")
except Exception as e:
    print(f"❌ RentalOrder import failed: {e}")

try:
    from apps.payments.models import Payment
    print("✅ Payment import successful")
except Exception as e:
    print(f"❌ Payment import failed: {e}")

try:
    from apps.deliveries.models import DeliveryDocument
    print("✅ DeliveryDocument import successful")
except Exception as e:
    print(f"❌ DeliveryDocument import failed: {e}")

try:
    from apps.notifications.models import NotificationTemplate, Notification, NotificationLog
    print("✅ Notification models import successful")
except Exception as e:
    print(f"❌ Notification models import failed: {e}")

try:
    from utils.email_service import EmailService
    print("✅ EmailService import successful")
except Exception as e:
    print(f"❌ EmailService import failed: {e}")

# Test model attribute access patterns
try:
    # Test if we can access the model fields we're using in tasks
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Check if the model structure matches our usage
    order_fields = ['customer', 'rental_start', 'rental_end', 'reference_number']
    for field in order_fields:
        if hasattr(RentalOrder, field):
            print(f"✅ RentalOrder.{field} exists")
        else:
            print(f"❌ RentalOrder.{field} missing")
    
    payment_fields = ['gateway_payment_id', 'amount', 'invoice', 'get_payment_method_display', 'processed_at']
    for field in payment_fields:
        if hasattr(Payment, field):
            print(f"✅ Payment.{field} exists")
        else:
            print(f"❌ Payment.{field} missing")
            
    print("✅ All import and field checks completed")
    
except Exception as e:
    print(f"❌ Model field check failed: {e}")

print("\n=== Import Test Complete ===")

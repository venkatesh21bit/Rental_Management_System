#!/usr/bin/env python
"""
Quick email configuration test script
Run this script to verify your email settings are working correctly.

Usage:
python test_email_config.py your-email@example.com
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from utils.email_service import email_service


def test_email_configuration(test_email=None):
    """Test email configuration"""
    
    print("🔧 Testing Email Configuration...")
    print(f"📧 Email Host: {settings.EMAIL_HOST}")
    print(f"🔌 Email Port: {settings.EMAIL_PORT}")
    print(f"🔐 Email User: {settings.EMAIL_HOST_USER}")
    print(f"✉️  From Email: {settings.DEFAULT_FROM_EMAIL}")
    print("-" * 50)
    
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        print("❌ Email credentials not configured!")
        print("Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in your .env file")
        return False
    
    # Test 1: Django's basic send_mail
    print("📤 Test 1: Basic Django Email...")
    try:
        result = send_mail(
            subject='Test Email from Rental Management System',
            message='This is a test email to verify your email configuration is working.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email or settings.EMAIL_HOST_USER],
            fail_silently=False,
        )
        if result:
            print("✅ Basic email test successful!")
        else:
            print("❌ Basic email test failed!")
            return False
    except Exception as e:
        print(f"❌ Basic email test failed: {str(e)}")
        return False
    
    # Test 2: Email service template
    print("📤 Test 2: Template Email Service...")
    try:
        success = email_service.send_notification_email(
            to_email=test_email or settings.EMAIL_HOST_USER,
            subject='Template Test - Rental Management System',
            template_name='welcome',
            context={
                'user': {
                    'first_name': 'Test User',
                    'email': test_email or settings.EMAIL_HOST_USER
                }
            },
            notification_type='TEST'
        )
        if success:
            print("✅ Template email test successful!")
        else:
            print("❌ Template email test failed!")
            return False
    except Exception as e:
        print(f"❌ Template email test failed: {str(e)}")
        return False
    
    print("-" * 50)
    print("🎉 All email tests passed!")
    print(f"📧 Test emails sent to: {test_email or settings.EMAIL_HOST_USER}")
    print("Check your inbox (and spam folder) for the test emails.")
    
    return True


def show_configuration_help():
    """Show help for configuring email"""
    print("""
📧 Email Configuration Help:

1. Create a Gmail account (e.g., rentalmanagement2024@gmail.com)
2. Enable 2-Step Verification in Google Account
3. Generate App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification  
   - App passwords → Select "Mail"
   - Copy the 16-character password

4. Create .env file with:
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=rentalmanagement2024@gmail.com
   EMAIL_HOST_PASSWORD=your-16-char-app-password
   DEFAULT_FROM_EMAIL=Rental Management System <rentalmanagement2024@gmail.com>

5. Run this test again: python test_email_config.py your-email@example.com
""")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_email_config.py your-email@example.com")
        print("Or: python test_email_config.py (will send test to configured email)")
        show_configuration_help()
        sys.exit(1)
    
    test_email = sys.argv[1] if len(sys.argv) > 1 and '@' in sys.argv[1] else None
    
    success = test_email_configuration(test_email)
    
    if not success:
        show_configuration_help()
        sys.exit(1)

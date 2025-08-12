#!/usr/bin/env python
"""
Test script to verify the dashboard API endpoint works
"""
import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_dashboard_endpoint():
    """Test the dashboard stats endpoint"""
    client = Client()
    
    try:
        # Create a test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        
        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        # Test the dashboard endpoint
        response = client.get(
            '/api/dashboard/stats/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.content.decode()}")
        
        if response.status_code == 200:
            print("✅ Dashboard endpoint is working!")
            return True
        else:
            print("❌ Dashboard endpoint failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing dashboard endpoint: {e}")
        return False

if __name__ == '__main__':
    print("Testing dashboard API endpoint...")
    test_dashboard_endpoint()

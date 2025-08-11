#!/usr/bin/env python
"""
Requirements Validation Script
Checks if all Django INSTALLED_APPS have corresponding packages in requirements.txt
"""

import os
import sys
import importlib
from pathlib import Path

# Add the project to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Import Django and setup
import django
django.setup()

from django.conf import settings

# Package mapping for apps that have different package names
PACKAGE_MAPPING = {
    'corsheaders': 'django-cors-headers',
    'rest_framework': 'djangorestframework', 
    'rest_framework_simplejwt': 'djangorestframework-simplejwt',
    'django_celery_beat': 'django-celery-beat',
    'django_celery_results': 'django-celery-results',
    'django_filters': 'django-filter',
    'csp': 'django-csp',
    'django_ratelimit': 'django-ratelimit',
    'health_check': 'django-health-check',
    'drf_spectacular': 'drf-spectacular',
    'debug_toolbar': 'django-debug-toolbar',
    'django_extensions': 'django-extensions',
}

def check_installed_apps():
    """Check if all installed apps have corresponding packages"""
    
    # Get current requirements.txt content
    requirements_file = project_root / 'requirements.txt'
    if requirements_file.exists():
        with open(requirements_file, 'r') as f:
            requirements_content = f.read().lower()
    else:
        requirements_content = ""
    
    print("🔍 Checking Django INSTALLED_APPS against requirements.txt...\n")
    
    missing_packages = []
    found_packages = []
    
    for app in settings.INSTALLED_APPS:
        # Skip Django built-in apps
        if app.startswith('django.contrib.'):
            continue
            
        # Skip local apps (starting with 'apps.')
        if app.startswith('apps.'):
            continue
            
        # Get package name
        package_name = PACKAGE_MAPPING.get(app, app)
        
        # Check if package is in requirements
        if package_name.lower().replace('_', '-') in requirements_content:
            found_packages.append(f"✅ {app} -> {package_name}")
        else:
            missing_packages.append(f"❌ {app} -> {package_name}")
            
        # Try to import the package
        try:
            importlib.import_module(app)
            print(f"✅ {app} (importable)")
        except ImportError as e:
            print(f"❌ {app} (NOT importable): {e}")
    
    print(f"\n📋 Summary:")
    print(f"✅ Found packages: {len(found_packages)}")
    print(f"❌ Missing packages: {len(missing_packages)}")
    
    if missing_packages:
        print(f"\n🚨 Missing packages in requirements.txt:")
        for package in missing_packages:
            print(f"  {package}")
            
    if found_packages:
        print(f"\n✅ Found packages in requirements.txt:")
        for package in found_packages:
            print(f"  {package}")
    
    return len(missing_packages) == 0

def check_imports():
    """Check if all packages can be imported"""
    print("\n🧪 Testing package imports...")
    
    test_imports = [
        'csp',
        'django_ratelimit', 
        'health_check',
        'drf_spectacular',
        'debug_toolbar',
        'django_extensions',
        'corsheaders',
        'rest_framework',
        'rest_framework_simplejwt',
        'django_celery_beat',
        'django_celery_results',
        'django_filters',
    ]
    
    failed_imports = []
    
    for module in test_imports:
        try:
            importlib.import_module(module)
            print(f"✅ {module}")
        except ImportError as e:
            print(f"❌ {module}: {e}")
            failed_imports.append(module)
    
    return len(failed_imports) == 0

if __name__ == '__main__':
    print("🚀 Django Requirements Validation\n")
    
    apps_ok = check_installed_apps()
    imports_ok = check_imports()
    
    if apps_ok and imports_ok:
        print("\n🎉 All checks passed! Requirements are complete.")
        sys.exit(0)
    else:
        print("\n⚠️ Some checks failed. Please fix missing packages.")
        sys.exit(1)

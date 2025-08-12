#!/usr/bin/env python
"""
Update existing products with daily rates
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.catalog.models import Product

def update_product_rates():
    """Update existing products with daily rates"""
    
    print("🔧 Updating product daily rates...")
    
    # Product rates mapping
    product_rates = {
        'MacBook Pro 16"': 45.00,
        'Canon EOS R5': 85.00,
        'iPad Pro 12.9"': 25.00,
        'Sony A7 III': 65.00,
        'DeWalt Drill Set': 15.00,
        'Makita Circular Saw': 20.00,
        'Bosch Laser Level': 12.00,
        'Executive Office Chair': 8.00,
        'Standing Desk': 10.00,
        'Conference Table': 18.00,
        'Tesla Model 3': 150.00,
        'BMW X5': 180.00,
        'Harley Davidson': 95.00,
        'Professional Bike': 22.00,
        'Kayak Set': 35.00,
        'Golf Cart': 55.00,
        'DJ Sound System': 75.00,
        'Party Tent 20x30': 120.00,
        'LED Light Setup': 60.00,
        'Mini Excavator': 250.00,
        'Concrete Mixer': 85.00,
        'Scaffolding Set': 45.00,
        'Studio Lighting Kit': 40.00,
        'Drone with Camera': 90.00,
        'Photo Booth Setup': 110.00,
    }
    
    updated_count = 0
    for product_name, rate in product_rates.items():
        try:
            product = Product.objects.get(name=product_name)
            product.daily_rate = Decimal(str(rate))
            product.save()
            print(f"✅ Updated {product_name}: ${rate}/day")
            updated_count += 1
        except Product.DoesNotExist:
            print(f"⚠️  Product not found: {product_name}")
        except Exception as e:
            print(f"❌ Error updating {product_name}: {str(e)}")
    
    # Update any remaining products without daily_rate
    products_without_rate = Product.objects.filter(daily_rate__isnull=True)
    for product in products_without_rate:
        # Set a default rate based on category
        if product.category:
            category_name = product.category.name.lower()
            if 'vehicle' in category_name:
                default_rate = 100.00
            elif 'electronic' in category_name:
                default_rate = 50.00
            elif 'construction' in category_name:
                default_rate = 80.00
            elif 'furniture' in category_name:
                default_rate = 15.00
            else:
                default_rate = 25.00
        else:
            default_rate = 25.00
        
        product.daily_rate = Decimal(str(default_rate))
        product.save()
        print(f"✅ Set default rate for {product.name}: ${default_rate}/day")
        updated_count += 1
    
    print(f"🎯 Updated {updated_count} products with daily rates")
    print("✅ All products now have daily rates!")

if __name__ == '__main__':
    update_product_rates()

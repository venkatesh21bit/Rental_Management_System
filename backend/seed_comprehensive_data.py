#!/usr/bin/env python
"""
Comprehensive Data Seeding Script for Rental Management System
Run this script to populate your    for name, description, discount in customer_groups_data:
        CustomerGroup.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'discount_percent': Decimal(discount)
            }
        )e with sample data
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import UserProfile, CustomerGroup
from apps.catalog.models import ProductCategory, Product, ProductImage, ProductItem
from apps.pricing.models import PriceList, PriceRule, LateFeeRule
from apps.orders.models import RentalQuote, RentalOrder, RentalItem
from apps.deliveries.models import DeliveryDocument
from apps.invoicing.models import Invoice, TaxRate
from apps.payments.models import PaymentProvider, Payment
from apps.notifications.models import NotificationTemplate
from apps.reports.models import ScheduledReport

User = get_user_model()

def create_sample_data():
    """Create comprehensive sample data for all models"""
    
    print("🚀 Starting comprehensive data seeding...")
    
    # 1. Create Users and Profiles
    print("👥 Creating users and profiles...")
    
    # Admin user (if not exists)
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@rental.com',
            'first_name': 'System',
            'last_name': 'Administrator',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
    
    # Staff users
    staff_users = []
    for i in range(3):
        user, created = User.objects.get_or_create(
            username=f'staff{i+1}',
            defaults={
                'email': f'staff{i+1}@rental.com',
                'first_name': f'Staff',
                'last_name': f'Member {i+1}',
                'is_staff': True
            }
        )
        if created:
            user.set_password('staff123')
            user.save()
        staff_users.append(user)
    
    # Customer users
    customers = []
    customer_data = [
        ('john_doe', 'john@email.com', 'John', 'Doe'),
        ('jane_smith', 'jane@email.com', 'Jane', 'Smith'),
        ('mike_wilson', 'mike@email.com', 'Mike', 'Wilson'),
        ('sarah_johnson', 'sarah@email.com', 'Sarah', 'Johnson'),
        ('david_brown', 'david@email.com', 'David', 'Brown'),
    ]
    
    for username, email, first_name, last_name in customer_data:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
            }
        )
        if created:
            user.set_password('customer123')
            user.save()
        customers.append(user)
    
    # Create User Profiles
    for user in staff_users:
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': UserProfile.Role.STAFF,
                'phone': '+1234567890',
                'address': '123 Staff Street, City, State'
            }
        )
    
    for user in customers:
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': UserProfile.Role.CUSTOMER,
                'phone': '+1987654321',
                'address': f'{user.first_name} Address, City, State'
            }
        )
    
    # 2. Create Customer Groups
    print("👥 Creating customer groups...")
    
    customer_groups = [
        ('VIP Customers', 'Premium customers with special benefits', 15.0),
        ('Regular Customers', 'Standard customer group', 5.0),
        ('Corporate Clients', 'Business customers', 10.0),
    ]
    
    for name, description, discount in customer_groups:
        CustomerGroup.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'discount_percent': Decimal(discount)
            }
        )
    
    # 3. Create Categories
    print("📦 Creating categories...")
    
    categories_data = [
        ('Electronics', 'Electronic devices and gadgets'),
        ('Tools & Equipment', 'Professional tools and equipment'),
        ('Furniture', 'Furniture and home decor items'),
        ('Vehicles', 'Cars, bikes, and transportation'),
        ('Sports & Recreation', 'Sports equipment and recreational items'),
        ('Events & Parties', 'Party supplies and event equipment'),
        ('Construction', 'Construction tools and machinery'),
        ('Photography', 'Cameras and photography equipment'),
    ]
    
    categories = []
    for name, description in categories_data:
        category, created = ProductCategory.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'is_active': True
            }
        )
        categories.append(category)
    
    # 4. Create Products
    print("🛍️ Creating products...")
    
    products_data = [
        # Electronics (name, description, category, daily_rate)
        ('MacBook Pro 16"', 'High-performance laptop for professionals', categories[0], 45.00),
        ('Canon EOS R5', 'Professional mirrorless camera', categories[0], 85.00),
        ('iPad Pro 12.9"', 'Powerful tablet for creative work', categories[0], 25.00),
        ('Sony A7 III', 'Full-frame mirrorless camera', categories[0], 65.00),
        
        # Tools & Equipment
        ('DeWalt Drill Set', 'Professional cordless drill with accessories', categories[1], 15.00),
        ('Makita Circular Saw', 'High-performance circular saw', categories[1], 20.00),
        ('Bosch Laser Level', 'Precision laser level for construction', categories[1], 12.00),
        
        # Furniture
        ('Executive Office Chair', 'Ergonomic leather office chair', categories[2], 8.00),
        ('Standing Desk', 'Adjustable height standing desk', categories[2], 10.00),
        ('Conference Table', 'Large conference table for meetings', categories[2], 18.00),
        
        # Vehicles
        ('Tesla Model 3', 'Electric luxury sedan', categories[3], 150.00),
        ('BMW X5', 'Premium SUV for family trips', categories[3], 180.00),
        ('Harley Davidson', 'Classic motorcycle for adventures', categories[3], 95.00),
        
        # Sports & Recreation
        ('Professional Bike', 'High-end mountain bike', categories[4], 22.00),
        ('Kayak Set', 'Complete kayaking equipment', categories[4], 35.00),
        ('Golf Cart', 'Electric golf cart', categories[4], 55.00),
        
        # Events & Parties
        ('DJ Sound System', 'Professional audio system', categories[5], 75.00),
        ('Party Tent 20x30', 'Large event tent', categories[5], 120.00),
        ('LED Light Setup', 'Professional lighting system', categories[5], 60.00),
        
        # Construction
        ('Mini Excavator', 'Compact excavator for construction', categories[6], 250.00),
        ('Concrete Mixer', 'Industrial concrete mixer', categories[6], 85.00),
        ('Scaffolding Set', 'Complete scaffolding system', categories[6], 45.00),
        
        # Photography
        ('Studio Lighting Kit', 'Professional studio lighting', categories[7], 40.00),
        ('Drone with Camera', '4K drone for aerial photography', categories[7], 90.00),
        ('Photo Booth Setup', 'Complete photo booth system', categories[7], 110.00),
    ]
    
    products = []
    for name, description, category, daily_rate in products_data:
        product, created = Product.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'category': category,
                'sku': f'SKU{len(products)+1:04d}',
                'name': name,
                'brand': 'Sample Manufacturer',
                'model': f'Model-{len(products)+1}',
                'year': 2023,
                'rentable': True,
                'is_active': True,
                'quantity_on_hand': 5,
                'default_rental_unit': 'DAY',
                'daily_rate': Decimal(str(daily_rate)),
            }
        )
        products.append(product)
    
    # 5. Create Product Items (Serial tracked items)
    print("📊 Creating product items...")
    
    for i, product in enumerate(products):
        # Create 2-5 product items per product
        quantity = min(5, max(2, (i % 4) + 2))
        for j in range(quantity):
            ProductItem.objects.get_or_create(
                product=product,
                serial_number=f'{product.sku}-{j+1:03d}',
                defaults={
                    'status': 'AVAILABLE',
                    'condition_rating': [10, 9, 8][j % 3],
                    'location': ['Warehouse A', 'Warehouse B', 'Store Front'][j % 3],
                    'condition_notes': f'Good condition item #{j+1}',
                }
            )
    
    # 7. Create Late Fee Rules
    print("💰 Creating late fee rules...")
    
    # Standard Late Fee Rule
    standard_price_list, created = PriceList.objects.get_or_create(
        name='Standard Pricing',
        defaults={
            'description': 'Standard rental pricing for all customers',
            'is_active': True,
            'valid_from': timezone.now().date(),
        }
    )
    
    # VIP Price List
    vip_price_list, created = PriceList.objects.get_or_create(
        name='VIP Pricing',
        defaults={
            'description': 'Special pricing for VIP customers',
            'is_active': True,
            'valid_from': timezone.now().date(),
        }
    )
    
    # Create a standard late fee rule
    LateFeeRule.objects.get_or_create(
        name='Standard Late Fee',
        defaults={
            'description': 'Standard late fee for overdue rentals',
            'fee_type': 'PERCENTAGE',
            'fee_value': Decimal('5.0'),
            'grace_period_hours': 24,
            'is_active': True,
        }
    )
    
    # 8. Create Tax Rates
    print("📋 Creating tax rates...")
    
    tax_rates_data = [
        ('VAT', 'Value Added Tax', 18.0),
        ('GST', 'Goods and Services Tax', 12.0),
        ('Service Tax', 'Service charge tax', 5.0),
    ]
    
    for name, description, rate in tax_rates_data:
        TaxRate.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'rate': Decimal(rate),
                'is_active': True,
            }
        )
    
    # 9. Create Payment Providers
    print("💳 Creating payment providers...")
    
    providers_data = [
        ('Stripe', 'stripe', 'Credit/Debit cards via Stripe'),
        ('Razorpay', 'razorpay', 'Indian payment gateway'),
        ('PayPal', 'paypal', 'International payments via PayPal'),
        ('Bank Transfer', 'bank_transfer', 'Direct bank transfers'),
    ]
    
    for name, provider_type, description in providers_data:
        PaymentProvider.objects.get_or_create(
            name=name,
            defaults={
                'provider_type': provider_type,
                'description': description,
                'is_active': True,
                'api_key': f'test_key_{provider_type}',
                'webhook_url': f'https://your-app.railway.app/api/payments/webhooks/{provider_type}/',
            }
        )
    
    # 10. Create Notification Templates
    print("📧 Creating notification templates...")
    
    templates_data = [
        ('ORDER_CONFIRMATION', 'Order Confirmation', 'Your order #{order_id} has been confirmed'),
        ('PAYMENT_RECEIVED', 'Payment Received', 'Payment of ${amount} received successfully'),
        ('DELIVERY_SCHEDULED', 'Delivery Scheduled', 'Your delivery is scheduled for {delivery_date}'),
        ('RETURN_REMINDER', 'Return Reminder', 'Please return your rental items by {return_date}'),
        ('INVOICE_GENERATED', 'Invoice Generated', 'Invoice #{invoice_id} is ready'),
    ]
    
    for template_type, subject, body in templates_data:
        NotificationTemplate.objects.get_or_create(
            name=template_type,
            defaults={
                'template_type': template_type,
                'subject': subject,
                'body_template': body,
                'is_active': True,
            }
        )
    
    # 11. Create Sample Orders
    print("📝 Creating sample orders...")
    
    # Create some quotes and orders
    for i, customer in enumerate(customers[:3]):
        # Calculate totals based on actual products
        selected_products = products[i*2:(i*2)+2] if len(products) >= (i*2)+2 else products[:2]
        rental_days = 7
        subtotal = sum([(product.daily_rate or Decimal('25.00')) * rental_days for product in selected_products])
        tax_amount = subtotal * Decimal('0.18')  # 18% tax
        total_amount = subtotal + tax_amount
        
        # Create quote
        quote = RentalQuote.objects.create(
            customer=customer,
            quote_number=f'QT{timezone.now().year}{i+1:04d}',
            rental_start_date=timezone.now().date() + timedelta(days=7),
            rental_end_date=timezone.now().date() + timedelta(days=14),
            status='PENDING',
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            notes='Sample quote for demonstration',
        )
        
        # Convert quote to order
        order = RentalOrder.objects.create(
            customer=customer,
            quote=quote,
            order_number=f'ORD{timezone.now().year}{i+1:04d}',
            rental_start=timezone.now() + timedelta(days=7),
            rental_end=timezone.now() + timedelta(days=14),
            status='CONFIRMED',
            subtotal=quote.subtotal,
            tax_amount=quote.tax_amount,
            total_amount=quote.total_amount,
            deposit_amount=Decimal('200.00'),
            created_by=staff_users[0],  # Assign first staff as creator
        )
        
        # Add rental items
        for j in range(2):
            if j < len(products):
                product = products[j + i*2]
                rental_days = 7  # 7 days rental
                unit_price = product.daily_rate or Decimal('25.00')
                line_total = unit_price * rental_days
                
                RentalItem.objects.create(
                    order=order,
                    product=product,
                    quantity=1,
                    unit_price=unit_price,
                    line_total=line_total,
                    start_datetime=timezone.now() + timedelta(days=7),
                    end_datetime=timezone.now() + timedelta(days=14),
                    rental_unit='DAY',
                )
    
    print("✅ Sample data creation completed!")
    print(f"   - {User.objects.count()} users created")
    print(f"   - {ProductCategory.objects.count()} categories created")
    print(f"   - {Product.objects.count()} products created")
    print(f"   - {ProductItem.objects.count()} product items created")
    print(f"   - {RentalOrder.objects.count()} sample orders created")
    print(f"   - {NotificationTemplate.objects.count()} notification templates created")
    print(f"   - {PaymentProvider.objects.count()} payment providers configured")
    
    print("\n🎯 Ready to use credentials:")
    print("   Admin: username='admin', password='admin123'")
    print("   Staff: username='staff1', password='staff123'")
    print("   Customer: username='john_doe', password='customer123'")


if __name__ == '__main__':
    create_sample_data()

#!/usr/bin/env python
"""
Comprehensive Data Seeding Script for Rental Management System
Run this script to populate your database with sample data
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
from apps.orders.models import RentalQuote, RentalOrder, OrderItem
from apps.deliveries.models import DeliveryDocument, DocumentType
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
                'discount_percentage': Decimal(discount)
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
        # Electronics
        ('MacBook Pro 16"', 'High-performance laptop for professionals', categories[0]),
        ('Canon EOS R5', 'Professional mirrorless camera', categories[0]),
        ('iPad Pro 12.9"', 'Powerful tablet for creative work', categories[0]),
        ('Sony A7 III', 'Full-frame mirrorless camera', categories[0]),
        
        # Tools & Equipment
        ('DeWalt Drill Set', 'Professional cordless drill with accessories', categories[1]),
        ('Makita Circular Saw', 'High-performance circular saw', categories[1]),
        ('Bosch Laser Level', 'Precision laser level for construction', categories[1]),
        
        # Furniture
        ('Executive Office Chair', 'Ergonomic leather office chair', categories[2]),
        ('Standing Desk', 'Adjustable height standing desk', categories[2]),
        ('Conference Table', 'Large conference table for meetings', categories[2]),
        
        # Vehicles
        ('Tesla Model 3', 'Electric luxury sedan', categories[3]),
        ('BMW X5', 'Premium SUV for family trips', categories[3]),
        ('Harley Davidson', 'Classic motorcycle for adventures', categories[3]),
        
        # Sports & Recreation
        ('Professional Bike', 'High-end mountain bike', categories[4]),
        ('Kayak Set', 'Complete kayaking equipment', categories[4]),
        ('Golf Cart', 'Electric golf cart', categories[4]),
        
        # Events & Parties
        ('DJ Sound System', 'Professional audio system', categories[5]),
        ('Party Tent 20x30', 'Large event tent', categories[5]),
        ('LED Light Setup', 'Professional lighting system', categories[5]),
        
        # Construction
        ('Mini Excavator', 'Compact excavator for construction', categories[6]),
        ('Concrete Mixer', 'Industrial concrete mixer', categories[6]),
        ('Scaffolding Set', 'Complete scaffolding system', categories[6]),
        
        # Photography
        ('Studio Lighting Kit', 'Professional studio lighting', categories[7]),
        ('Drone with Camera', '4K drone for aerial photography', categories[7]),
        ('Photo Booth Setup', 'Complete photo booth system', categories[7]),
    ]
    
    products = []
    for name, description, category in products_data:
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
            'effective_from': timezone.now(),
        }
    )
    
    # VIP Price List
    vip_price_list, created = PriceList.objects.get_or_create(
        name='VIP Pricing',
        defaults={
            'description': 'Special pricing for VIP customers',
            'is_active': True,
            'effective_from': timezone.now(),
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
        # Create quote
        quote = RentalQuote.objects.create(
            customer=customer,
            quote_number=f'QT{timezone.now().year}{i+1:04d}',
            rental_start_date=timezone.now().date() + timedelta(days=7),
            rental_end_date=timezone.now().date() + timedelta(days=14),
            status='PENDING',
            subtotal=Decimal('500.00'),
            tax_amount=Decimal('90.00'),
            total_amount=Decimal('590.00'),
            notes='Sample quote for demonstration',
        )
        
        # Convert quote to order
        order = RentalOrder.objects.create(
            customer=customer,
            quote=quote,
            order_number=f'ORD{timezone.now().year}{i+1:04d}',
            rental_start_date=quote.rental_start_date,
            rental_end_date=quote.rental_end_date,
            status='CONFIRMED',
            subtotal=quote.subtotal,
            tax_amount=quote.tax_amount,
            total_amount=quote.total_amount,
            security_deposit=Decimal('200.00'),
        )
        
        # Add order items
        for j in range(2):
            if j < len(products):
                OrderItem.objects.create(
                    order=order,
                    product=products[j + i*2],
                    quantity=1,
                    daily_rate=Decimal('25.00'),
                    total_amount=Decimal('175.00'),
                )
    
    # 12. Create Document Types
    print("📄 Creating document types...")
    
    document_types_data = [
        ('DELIVERY_NOTE', 'Delivery Note'),
        ('RETURN_RECEIPT', 'Return Receipt'),
        ('PICKUP_SLIP', 'Pickup Slip'),
        ('DAMAGE_REPORT', 'Damage Report'),
    ]
    
    for code, name in document_types_data:
        DocumentType.objects.get_or_create(
            name=name,
            defaults={
                'code': code,
                'description': f'{name} for rental operations',
                'is_active': True,
            }
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

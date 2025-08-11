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
from apps.catalog.models import Category, Product, ProductImage, InventoryItem
from apps.pricing.models import PriceList, PricingRule, Discount, LoyaltyProgram
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
        category, created = Category.objects.get_or_create(
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
        ('MacBook Pro 16"', 'High-performance laptop for professionals', categories[0], 2500.00, 50.00),
        ('Canon EOS R5', 'Professional mirrorless camera', categories[0], 3500.00, 75.00),
        ('iPad Pro 12.9"', 'Powerful tablet for creative work', categories[0], 1200.00, 25.00),
        ('Sony A7 III', 'Full-frame mirrorless camera', categories[0], 2000.00, 45.00),
        
        # Tools & Equipment
        ('DeWalt Drill Set', 'Professional cordless drill with accessories', categories[1], 350.00, 15.00),
        ('Makita Circular Saw', 'High-performance circular saw', categories[1], 280.00, 12.00),
        ('Bosch Laser Level', 'Precision laser level for construction', categories[1], 450.00, 18.00),
        
        # Furniture
        ('Executive Office Chair', 'Ergonomic leather office chair', categories[2], 800.00, 20.00),
        ('Standing Desk', 'Adjustable height standing desk', categories[2], 650.00, 25.00),
        ('Conference Table', 'Large conference table for meetings', categories[2], 1200.00, 35.00),
        
        # Vehicles
        ('Tesla Model 3', 'Electric luxury sedan', categories[3], 45000.00, 200.00),
        ('BMW X5', 'Premium SUV for family trips', categories[3], 55000.00, 250.00),
        ('Harley Davidson', 'Classic motorcycle for adventures', categories[3], 18000.00, 120.00),
        
        # Sports & Recreation
        ('Professional Bike', 'High-end mountain bike', categories[4], 2500.00, 35.00),
        ('Kayak Set', 'Complete kayaking equipment', categories[4], 800.00, 25.00),
        ('Golf Cart', 'Electric golf cart', categories[4], 8000.00, 60.00),
        
        # Events & Parties
        ('DJ Sound System', 'Professional audio system', categories[5], 2200.00, 80.00),
        ('Party Tent 20x30', 'Large event tent', categories[5], 1500.00, 65.00),
        ('LED Light Setup', 'Professional lighting system', categories[5], 1800.00, 55.00),
        
        # Construction
        ('Mini Excavator', 'Compact excavator for construction', categories[6], 35000.00, 300.00),
        ('Concrete Mixer', 'Industrial concrete mixer', categories[6], 4500.00, 85.00),
        ('Scaffolding Set', 'Complete scaffolding system', categories[6], 2800.00, 45.00),
        
        # Photography
        ('Studio Lighting Kit', 'Professional studio lighting', categories[7], 1200.00, 40.00),
        ('Drone with Camera', '4K drone for aerial photography', categories[7], 1800.00, 35.00),
        ('Photo Booth Setup', 'Complete photo booth system', categories[7], 2500.00, 75.00),
    ]
    
    products = []
    for name, description, category, value, daily_rate in products_data:
        product, created = Product.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'category': category,
                'estimated_value': Decimal(value),
                'daily_rental_rate': Decimal(daily_rate),
                'is_rentable': True,
                'is_available': True,
                'condition': 'EXCELLENT',
                'sku': f'SKU{len(products)+1:04d}',
                'barcode': f'BC{len(products)+1:010d}',
                'manufacturer': 'Sample Manufacturer',
                'model': f'Model-{len(products)+1}',
                'year_manufactured': 2023,
            }
        )
        products.append(product)
    
    # 5. Create Inventory Items
    print("📊 Creating inventory items...")
    
    for i, product in enumerate(products):
        # Create 2-5 inventory items per product
        quantity = min(5, max(2, (i % 4) + 2))
        for j in range(quantity):
            InventoryItem.objects.get_or_create(
                product=product,
                serial_number=f'{product.sku}-{j+1:03d}',
                defaults={
                    'condition': ['EXCELLENT', 'GOOD', 'FAIR'][j % 3],
                    'location': ['Warehouse A', 'Warehouse B', 'Store Front'][j % 3],
                    'is_available': True,
                    'last_maintenance': timezone.now() - timedelta(days=30),
                    'next_maintenance': timezone.now() + timedelta(days=90),
                }
            )
    
    # 6. Create Price Lists and Rules
    print("💰 Creating pricing rules...")
    
    # Standard Price List
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
    
    # 7. Create Discounts
    print("🎁 Creating discounts...")
    
    discounts_data = [
        ('WELCOME10', 'Welcome discount for new customers', 10.0, 'PERCENTAGE'),
        ('SUMMER20', 'Summer season discount', 20.0, 'PERCENTAGE'),
        ('BULK50', 'Bulk rental discount', 50.0, 'FIXED'),
        ('WEEKEND15', 'Weekend special discount', 15.0, 'PERCENTAGE'),
    ]
    
    for code, description, value, discount_type in discounts_data:
        Discount.objects.get_or_create(
            code=code,
            defaults={
                'description': description,
                'discount_type': discount_type,
                'value': Decimal(value),
                'is_active': True,
                'valid_from': timezone.now(),
                'valid_until': timezone.now() + timedelta(days=90),
                'min_order_value': Decimal('100.00'),
                'usage_limit': 100,
            }
        )
    
    # 8. Create Loyalty Program
    print("🏆 Creating loyalty program...")
    
    LoyaltyProgram.objects.get_or_create(
        name='Gold Member Rewards',
        defaults={
            'description': 'Earn points with every rental',
            'points_per_dollar': Decimal('1.0'),
            'redemption_rate': Decimal('0.01'),
            'is_active': True,
        }
    )
    
    # 9. Create Tax Rates
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
    
    # 10. Create Payment Providers
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
    
    # 11. Create Notification Templates
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
    
    # 12. Create Sample Orders
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
                    daily_rate=products[j + i*2].daily_rental_rate,
                    total_amount=products[j + i*2].daily_rental_rate * 7,
                )
    
    # 13. Create Document Types
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
    print(f"   - {Category.objects.count()} categories created")
    print(f"   - {Product.objects.count()} products created")
    print(f"   - {InventoryItem.objects.count()} inventory items created")
    print(f"   - {RentalOrder.objects.count()} sample orders created")
    print(f"   - {NotificationTemplate.objects.count()} notification templates created")
    print(f"   - {PaymentProvider.objects.count()} payment providers configured")
    
    print("\n🎯 Ready to use credentials:")
    print("   Admin: username='admin', password='admin123'")
    print("   Staff: username='staff1', password='staff123'")
    print("   Customer: username='john_doe', password='customer123'")


if __name__ == '__main__':
    create_sample_data()

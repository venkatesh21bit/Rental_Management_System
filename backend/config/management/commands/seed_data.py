"""
Management command to seed comprehensive sample data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import UserProfile, CustomerGroup
from apps.catalog.models import ProductCategory, Product, ProductImage, ProductItem
from apps.pricing.models import PriceList, PriceRule, Discount, LoyaltyProgram
from apps.orders.models import RentalQuote, RentalOrder, OrderItem
from apps.deliveries.models import DeliveryDocument
from apps.invoicing.models import Invoice, TaxRate
from apps.payments.models import PaymentProvider, Payment
from apps.notifications.models import NotificationTemplate
from apps.reports.models import ScheduledReport
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed comprehensive sample data for the rental management system'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Starting comprehensive data seeding...')
        
        # Create admin user if not exists
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
            self.stdout.write('✅ Admin user created')
        
        # Create sample customers
        customers_data = [
            ('john_doe', 'john@email.com', 'John', 'Doe'),
            ('jane_smith', 'jane@email.com', 'Jane', 'Smith'),
            ('mike_wilson', 'mike@email.com', 'Mike', 'Wilson'),
        ]
        
        customers = []
        for username, email, first_name, last_name in customers_data:
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
                
                # Create user profile
                UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'role': UserProfile.Role.CUSTOMER,
                        'phone': '+1987654321',
                        'address': f'{user.first_name} Address, City, State'
                    }
                )
            customers.append(user)
        
        self.stdout.write(f'✅ Created {len(customers)} customer users')
        
        # Create categories
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
        
        self.stdout.write(f'✅ Created {len(categories)} categories')
        
        # Create products
        products_data = [
            ('MacBook Pro 16"', 'High-performance laptop for professionals', categories[0]),
            ('Canon EOS R5', 'Professional mirrorless camera', categories[0]),
            ('iPad Pro 12.9"', 'Powerful tablet for creative work', categories[0]),
            ('DeWalt Drill Set', 'Professional cordless drill with accessories', categories[1]),
            ('Makita Circular Saw', 'High-performance circular saw', categories[1]),
            ('Executive Office Chair', 'Ergonomic leather office chair', categories[2]),
            ('Standing Desk', 'Adjustable height standing desk', categories[2]),
            ('Tesla Model 3', 'Electric luxury sedan', categories[3]),
            ('Professional Bike', 'High-end mountain bike', categories[4]),
            ('DJ Sound System', 'Professional audio system', categories[5]),
            ('Mini Excavator', 'Compact excavator for construction', categories[6]),
            ('Studio Lighting Kit', 'Professional studio lighting', categories[7]),
        ]
        
        products = []
        for name, description, category in products_data:
            product, created = Product.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'category': category,
                    'sku': f'SKU{len(products)+1:04d}',
                    'brand': 'Sample Brand',
                    'model': f'Model-{len(products)+1}',
                    'year': 2023,
                    'rentable': True,
                    'is_active': True,
                    'quantity_on_hand': 5,
                    'default_rental_unit': 'DAY',
                }
            )
            products.append(product)
        
        self.stdout.write(f'✅ Created {len(products)} products')
        
        # Create product items for serial tracking
        item_count = 0
        for product in products:
            for i in range(3):  # 3 items per product
                item, created = ProductItem.objects.get_or_create(
                    product=product,
                    serial_number=f'{product.sku}-{i+1:03d}',
                    defaults={
                        'status': 'AVAILABLE',
                        'condition_rating': 9,
                        'location': f'Warehouse {chr(65+i)}',
                        'condition_notes': f'Excellent condition item #{i+1}',
                    }
                )
                if created:
                    item_count += 1
        
        self.stdout.write(f'✅ Created {item_count} product items')
        
        # Create customer groups
        customer_groups_data = [
            ('VIP Customers', 'Premium customers with special benefits', 15.0),
            ('Regular Customers', 'Standard customer group', 5.0),
            ('Corporate Clients', 'Business customers', 10.0),
        ]
        
        for name, description, discount in customer_groups_data:
            CustomerGroup.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'discount_percentage': Decimal(discount)
                }
            )
        
        # Create tax rates
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
        
        # Create payment providers
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
        
        # Create notification templates
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
        
        # Create document types
        # Note: DocumentType is a choices class in DeliveryDocument, not a separate model
        # Document types are handled by DeliveryDocument.DocumentType choices
        
        # Summary
        self.stdout.write(self.style.SUCCESS('✅ Sample data creation completed!'))
        self.stdout.write(f'   - {User.objects.count()} users created')
        self.stdout.write(f'   - {ProductCategory.objects.count()} categories created')
        self.stdout.write(f'   - {Product.objects.count()} products created')
        self.stdout.write(f'   - {ProductItem.objects.count()} product items created')
        self.stdout.write(f'   - {NotificationTemplate.objects.count()} notification templates created')
        self.stdout.write(f'   - {PaymentProvider.objects.count()} payment providers configured')
        
        self.stdout.write(self.style.SUCCESS('\n🎯 Ready to use credentials:'))
        self.stdout.write('   Admin: username="admin", password="admin123"')
        self.stdout.write('   Customer: username="john_doe", password="customer123"')

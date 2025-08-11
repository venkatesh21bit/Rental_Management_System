from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import connection
from django.core.management.color import no_style
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Setup the database with initial data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset the database before setup',
        )
        parser.add_argument(
            '--seed',
            action='store_true',
            help='Seed comprehensive sample data',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database setup...'))

        if options['reset']:
            self.reset_database()

        # Run migrations
        self.stdout.write('Running migrations...')
        from django.core.management import call_command
        call_command('migrate')

        # Create superuser if it doesn't exist
        self.create_superusers()
        
        # Seed comprehensive data if requested
        if options['seed']:
            self.seed_comprehensive_data()

        self.stdout.write(self.style.SUCCESS('Database setup completed successfully!'))

    def reset_database(self):
        """Reset the database"""
        self.stdout.write('Resetting database...')
        
        # Get all table names
        with connection.cursor() as cursor:
            style = no_style()
            sql = connection.ops.sql_flush(style, connection.introspection.table_names())
            for query in sql:
                cursor.execute(query)

    def create_superusers(self):
        """Create default superusers"""
        self.stdout.write('Creating superusers...')

        # Create admin user
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
            self.stdout.write(self.style.SUCCESS('Created admin user (admin/admin123)'))

        # Create custom user
        if not User.objects.filter(username='venkatesh').exists():
            User.objects.create_superuser(
                username='venkatesh',
                email='venkatesh@example.com',
                password='venkat*2005'
            )
            self.stdout.write(self.style.SUCCESS('Created venkatesh user (venkatesh/venkat*2005)'))

        self.stdout.write(self.style.SUCCESS('Superusers created successfully!'))

    def seed_comprehensive_data(self):
        """Seed comprehensive sample data"""
        self.stdout.write('🚀 Seeding comprehensive sample data...')
        
        try:
            from apps.accounts.models import UserProfile, CustomerGroup
            from apps.catalog.models import ProductCategory, Product, ProductImage, ProductItem
            from apps.pricing.models import PriceList, PriceRule, Discount, LoyaltyProgram
            from apps.invoicing.models import TaxRate
            from apps.payments.models import PaymentProvider
            from apps.notifications.models import NotificationTemplate
            from apps.deliveries.models import DeliveryDocument
        except ImportError as e:
            self.stdout.write(self.style.ERROR(f'Import error: {e}'))
            return
        
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
        
        # Create basic business data
        self._create_tax_rates()
        self._create_payment_providers()
        self._create_notification_templates()
        # Note: Document types are choices in DeliveryDocument model
        
        self.stdout.write(self.style.SUCCESS('✅ Comprehensive sample data created!'))
        self.stdout.write('🎯 Login credentials:')
        self.stdout.write('   Admin: admin / admin123')
        self.stdout.write('   Customer: john_doe / customer123')
    
    def _create_tax_rates(self):
        """Create sample tax rates"""
        from apps.invoicing.models import TaxRate
        
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
    
    def _create_payment_providers(self):
        """Create sample payment providers"""
        from apps.payments.models import PaymentProvider
        
        providers_data = [
            ('Stripe', 'stripe', 'Credit/Debit cards via Stripe'),
            ('Razorpay', 'razorpay', 'Indian payment gateway'),
            ('PayPal', 'paypal', 'International payments via PayPal'),
        ]
        
        for name, provider_type, description in providers_data:
            PaymentProvider.objects.get_or_create(
                name=name,
                defaults={
                    'provider_type': provider_type,
                    'description': description,
                    'is_active': True,
                    'api_key': f'test_key_{provider_type}',
                }
            )
    
    def _create_notification_templates(self):
        """Create sample notification templates"""
        from apps.notifications.models import NotificationTemplate
        
        templates_data = [
            ('ORDER_CONFIRMATION', 'Order Confirmation', 'Your order has been confirmed'),
            ('PAYMENT_RECEIVED', 'Payment Received', 'Payment received successfully'),
            ('DELIVERY_SCHEDULED', 'Delivery Scheduled', 'Your delivery is scheduled'),
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
    
        # Note: DocumentType is a choices class in DeliveryDocument, not a separate model
        # Document types are handled by DeliveryDocument.DocumentType choices

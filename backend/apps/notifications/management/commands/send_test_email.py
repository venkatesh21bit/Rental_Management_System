"""
Management command to send test emails using the notification system.
Usage: python manage.py send_test_email --email user@example.com --template order_confirmation
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from utils.email_service import email_service
import json

User = get_user_model()


class Command(BaseCommand):
    help = 'Send test email notifications'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email address to send test email to'
        )
        parser.add_argument(
            '--template',
            type=str,
            required=True,
            choices=[
                'order_confirmation',
                'pickup_reminder', 
                'return_reminder',
                'overdue_notice',
                'payment_confirmation',
                'payment_reminder',
                'quote_sent',
                'delivery_update',
                'welcome',
                'password_reset'
            ],
            help='Email template to use'
        )
        parser.add_argument(
            '--context',
            type=str,
            help='JSON string with additional context data'
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='User ID to use as context (optional)'
        )
    
    def handle(self, *args, **options):
        email = options['email']
        template = options['template']
        context_str = options.get('context', '{}')
        user_id = options.get('user_id')
        
        try:
            additional_context = json.loads(context_str)
        except json.JSONDecodeError:
            raise CommandError('Invalid JSON in context parameter')
        
        # Get user if provided
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise CommandError(f'User with ID {user_id} not found')
        
        # Prepare default context based on template
        context = self.get_default_context(template, user)
        context.update(additional_context)
        
        # Send email
        self.stdout.write(f'Sending test email to {email} using template {template}...')
        
        success = email_service.send_notification_email(
            to_email=email,
            subject=f'Test Email - {template.replace("_", " ").title()}',
            template_name=template,
            context=context,
            user=user,
            notification_type='TEST'
        )
        
        if success:
            self.stdout.write(
                self.style.SUCCESS(f'Test email sent successfully to {email}')
            )
        else:
            self.stdout.write(
                self.style.ERROR(f'Failed to send test email to {email}')
            )
    
    def get_default_context(self, template, user=None):
        """Get default context data for each template"""
        
        default_user = {
            'first_name': user.first_name if user else 'Test User',
            'last_name': user.last_name if user else 'Demo',
            'email': user.email if user else 'test@example.com'
        }
        
        default_order = {
            'id': 'TEST123',
            'created_at': '2024-01-15 10:30',
            'start_date': '2024-01-20',
            'end_date': '2024-01-25',
            'total_amount': '5000.00',
            'status': 'CONFIRMED',
            'items': [
                {
                    'product_name': 'Premium Camera',
                    'quantity': 1,
                    'rate': '1000.00',
                    'subtotal': '1000.00'
                },
                {
                    'product_name': 'Tripod Stand',
                    'quantity': 2,
                    'rate': '200.00',
                    'subtotal': '400.00'
                }
            ]
        }
        
        default_payment = {
            'transaction_id': 'TXN123456789',
            'amount': '5000.00',
            'method': 'CREDIT_CARD',
            'created_at': '2024-01-15 10:30'
        }
        
        default_quote = {
            'id': 'QUO123',
            'valid_until': '2024-01-22',
            'total_amount': '5000.00'
        }
        
        contexts = {
            'order_confirmation': {
                'user': default_user,
                'order': default_order
            },
            'pickup_reminder': {
                'user': default_user,
                'order': default_order,
                'pickup_time': '10:00 AM - 6:00 PM',
                'pickup_address': 'Test Store Location, Test City'
            },
            'return_reminder': {
                'user': default_user,
                'order': default_order,
                'return_time': '10:00 AM - 6:00 PM',
                'return_address': 'Test Store Location, Test City'
            },
            'overdue_notice': {
                'user': default_user,
                'order': default_order,
                'days_overdue': 3,
                'late_fee': '300.00'
            },
            'payment_confirmation': {
                'user': default_user,
                'order': default_order,
                'payment': default_payment
            },
            'payment_reminder': {
                'user': default_user,
                'order': default_order,
                'amount_due': '2500.00',
                'due_date': '2024-01-18'
            },
            'quote_sent': {
                'user': default_user,
                'quote': default_quote
            },
            'delivery_update': {
                'user': default_user,
                'order': default_order,
                'delivery_status': 'In Transit',
                'delivery_message': 'Your order is on the way and will be delivered soon.',
                'expected_delivery': '2024-01-20'
            },
            'welcome': {
                'user': default_user
            },
            'password_reset': {
                'user': default_user,
                'reset_url': 'https://example.com/reset-password?token=abc123xyz'
            }
        }
        
        return contexts.get(template, {'user': default_user})

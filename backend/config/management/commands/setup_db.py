from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import connection
from django.core.management.color import no_style

User = get_user_model()


class Command(BaseCommand):
    help = 'Setup the database with initial data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset the database before setup',
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

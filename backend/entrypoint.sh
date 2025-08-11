#!/bin/bash

# Exit on any error
set -e

echo "Starting Django application setup..."

# Wait for database to be ready
echo "Waiting for database connection..."
python -c "
import os
import psycopg2
import time
import sys

max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        conn.close()
        print('Database connection successful!')
        break
    except psycopg2.OperationalError as e:
        retry_count += 1
        print(f'Database connection failed (attempt {retry_count}/{max_retries}): {e}')
        if retry_count >= max_retries:
            print('Max retries reached. Exiting.')
            sys.exit(1)
        time.sleep(2)
"

# Make migrations for all apps
echo "Making migrations..."
python manage.py makemigrations

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser using custom script
echo "Creating superuser using create_superuser.py..."
python -c "
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
exec(open('create_superuser.py').read())
"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Setup completed successfully!"

# Start the application
exec "$@"

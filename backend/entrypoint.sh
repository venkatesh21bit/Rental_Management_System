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

# Create superuser non-interactively (only if environment variables are set)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput || echo "Superuser already exists or creation failed"
else
    echo "Creating default superusers via setup_db..."
    python manage.py setup_db || echo "Default superuser creation failed - continuing anyway"
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Setup completed successfully!"

# Start the application
exec "$@"

#!/bin/bash

# Exit on any error
set -e

echo "Starting Django application setup..."

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

# Create superusers
echo "Creating superusers..."
python manage.py createsuperuser

# Set up database with initial data
echo "Setting up database..."
python manage.py setup_db

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Setup completed successfully!"

# Start the application
exec "$@"

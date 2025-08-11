#!/bin/bash
# Celery Beat (Scheduler) Startup Script for Railway

echo "Starting Celery Beat Scheduler..."

# Wait for database and Redis
echo "Waiting for services..."
python -c "
import os, time, redis, django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Wait for database
for i in range(30):
    try:
        connection.ensure_connection()
        print('Database is ready!')
        break
    except:
        print(f'Waiting for database... {i+1}/30')
        time.sleep(2)
else:
    print('Database connection failed!')
    exit(1)

# Wait for Redis
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
r = redis.from_url(redis_url)
for i in range(30):
    try:
        r.ping()
        print('Redis is ready!')
        break
    except:
        print(f'Waiting for Redis... {i+1}/30')
        time.sleep(2)
else:
    print('Redis connection failed!')
    exit(1)
"

# Set Django settings
export DJANGO_SETTINGS_MODULE=config.settings

# Start Celery beat
exec celery -A config beat \
    --loglevel=info \
    --scheduler=django_celery_beat.schedulers:DatabaseScheduler

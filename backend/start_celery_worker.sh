#!/bin/bash
# Celery Worker Startup Script for Railway

echo "Starting Celery Worker..."

# Wait for Redis to be available
echo "Waiting for Redis connection..."
python -c "
import os, time, redis
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

# Start Celery worker
exec celery -A config worker \
    --loglevel=info \
    --concurrency=2 \
    --max-tasks-per-child=1000 \
    --time-limit=300 \
    --soft-time-limit=240

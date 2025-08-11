# 🔴 Redis Setup for Railway Deployment

## Step 1: Add Redis Service to Railway

1. **Go to your Railway Dashboard**: https://railway.app/dashboard
2. **Open your project**: Click on your Rental Management System project
3. **Add Redis Service**:
   - Click "New Service" or "+" button
   - Select "Database" → "Redis"
   - Click "Add Redis"

## Step 2: Get Redis Connection URL

1. **Click on the Redis service** in your Railway dashboard
2. **Go to "Variables" tab**
3. **Copy the `REDIS_URL`** (it will look like: `redis://default:password@host:port`)

## Step 3: Add Redis URL to Django Service

1. **Go to your Django service** (main backend service)
2. **Open "Variables" tab**
3. **Add new variable**:
   - **Name**: `REDIS_URL`
   - **Value**: Paste the Redis URL you copied
4. **Click "Add Variable"**

## Step 4: Update Django Settings (Already Done)

Your settings.py already supports Redis via environment variables:

```python
# Celery Configuration
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')

# Cache configuration (Redis)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/1'),
    }
}
```

## Step 5: Verify Redis Connection

After adding the Redis URL, your Django app will automatically:
- ✅ Use Redis for Celery task queue
- ✅ Use Redis for caching
- ✅ Enable background task processing

## Important Notes:

- **Railway Auto-Connects**: Services in the same project can communicate privately
- **No Additional Config**: Just add the REDIS_URL variable
- **Automatic Scaling**: Railway handles Redis scaling automatically
- **Persistence**: Redis data persists across deployments

## Testing Redis Connection:

Visit: `https://your-app.up.railway.app/api/health/` to verify Redis connection status.

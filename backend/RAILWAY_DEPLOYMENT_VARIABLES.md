# Railway Environment Variables for Production Deployment

Copy and paste these environment variables into your Railway project settings:

## Required Core Variables

### Django Configuration
```
SECRET_KEY=your-production-secret-key-minimum-50-characters-long-and-random
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app,yourdomain.com
```

### Database (Automatically provided by Railway PostgreSQL)
```
DATABASE_URL=postgresql://postgres:password@host:port/database
```
*Note: Railway automatically provides DATABASE_URL when you add PostgreSQL service*

### Email Configuration (Gmail Setup)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=rentalmanagement2024@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-gmail-app-password
DEFAULT_FROM_EMAIL=Rental Management System <rentalmanagement2024@gmail.com>
DEFAULT_REPLY_TO_EMAIL=rentalmanagement2024@gmail.com
```

### Company Information
```
COMPANY_NAME=Rental Management System
COMPANY_PHONE=+91-9876543210
COMPANY_ADDRESS=Delhi, India
WEBSITE_URL=https://your-app.railway.app
```

### Redis Configuration (If using Railway Redis)
```
REDIS_URL=redis://default:password@host:port
```
*Note: Railway automatically provides REDIS_URL when you add Redis service*

### JWT Configuration
```
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

### CORS Configuration
```
CORS_ALLOW_ALL_ORIGINS=False
```

## Optional Variables (with defaults)

### Celery Configuration (if using background tasks)
```
CELERY_BROKER_URL=redis://default:password@host:port
CELERY_RESULT_BACKEND=redis://default:password@host:port
```

### Database Fallback (if not using Railway PostgreSQL)
```
DB_NAME=rental_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

## Complete Railway Environment Variables List

### Essential Variables (Copy these to Railway):
```
SECRET_KEY=django-production-key-make-this-very-long-and-random-at-least-50-characters
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=rentalmanagement2024@gmail.com
EMAIL_HOST_PASSWORD=replace-with-your-gmail-app-password
DEFAULT_FROM_EMAIL=Rental Management System <rentalmanagement2024@gmail.com>
COMPANY_NAME=Rental Management System
COMPANY_PHONE=+91-9876543210
COMPANY_ADDRESS=Delhi, India
WEBSITE_URL=https://your-app.railway.app
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
CORS_ALLOW_ALL_ORIGINS=False
```

## Railway Deployment Steps

### 1. Add Services in Railway:
- **PostgreSQL**: Add this service (provides DATABASE_URL automatically)
- **Redis**: Add this service for caching and Celery (provides REDIS_URL automatically)

### 2. Set Environment Variables:
Go to your Railway project → Variables tab → Add each variable above

### 3. Gmail App Password Setup:
1. Create Gmail account: `rentalmanagement2024@gmail.com`
2. Enable 2-Step Verification
3. Generate App Password:
   - Google Account → Security → 2-Step Verification
   - App passwords → Mail → Generate
   - Copy 16-character password to EMAIL_HOST_PASSWORD

### 4. Update ALLOWED_HOSTS:
Replace `your-app.railway.app` with your actual Railway domain

### 5. Generate SECRET_KEY:
```python
# Run this in Python to generate a secure key:
import secrets
print(secrets.token_urlsafe(50))
```

## Alternative Email Services for Production

### SendGrid (Recommended for high volume):
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your-sendgrid-api-key
```

### Amazon SES:
```
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-access-key-id
EMAIL_HOST_PASSWORD=your-secret-access-key
```

## Verification Commands

After deployment, test your setup:
```bash
# SSH into Railway container or use Railway CLI
railway run python manage.py check
railway run python manage.py collectstatic --noinput
railway run python manage.py migrate
```

## Security Notes

- ✅ Never commit these values to Git
- ✅ Use Railway's environment variables interface
- ✅ Enable 2FA on your Gmail account
- ✅ Use app passwords, not regular Gmail passwords
- ✅ Regularly rotate your SECRET_KEY
- ✅ Monitor email delivery rates

## Quick Copy-Paste for Railway

**Minimum required variables for Railway:**
```
SECRET_KEY=your-50-character-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=rentalmanagement2024@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=Rental Management System <rentalmanagement2024@gmail.com>
COMPANY_NAME=Rental Management System
WEBSITE_URL=https://your-app.railway.app
```

The rest will use sensible defaults from your Django settings.

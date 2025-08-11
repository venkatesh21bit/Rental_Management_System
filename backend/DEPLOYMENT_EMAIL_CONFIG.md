# Email Configuration for Deployment

## Environment Variables for Production

### 1. Create Production .env File

For your production deployment, create a `.env` file with these email settings:

```bash
# Email Configuration - Production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=rentalmanagement2024@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
DEFAULT_FROM_EMAIL=Rental Management System <rentalmanagement2024@gmail.com>
DEFAULT_REPLY_TO_EMAIL=rentalmanagement2024@gmail.com

# Company Information
COMPANY_NAME=Rental Management System
COMPANY_PHONE=+91-9876543210
COMPANY_ADDRESS=Delhi, India
WEBSITE_URL=https://your-production-domain.com
```

### 2. Gmail Setup for Production

#### Create Dedicated Gmail Account:
1. Create `rentalmanagement2024@gmail.com` (or your preferred email)
2. Enable 2-Step Verification
3. Generate App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - App passwords → Select "Mail"
   - Copy the 16-character password (format: `abcd efgh ijkl mnop`)

#### Gmail Limitations:
- **Free Gmail**: 500 emails per day
- **Google Workspace**: 2000 emails per day
- Consider upgrading for high-volume usage

## Deployment Platform Configurations

### 1. Railway Deployment

Add environment variables in Railway dashboard:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=rentalmanagement2024@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
DEFAULT_FROM_EMAIL=Rental Management System <rentalmanagement2024@gmail.com>
COMPANY_NAME=Rental Management System
WEBSITE_URL=https://your-app.railway.app
```

### 2. Heroku Deployment

```bash
# Using Heroku CLI
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USE_TLS=true
heroku config:set EMAIL_HOST_USER=rentalmanagement2024@gmail.com
heroku config:set EMAIL_HOST_PASSWORD="abcd efgh ijkl mnop"
heroku config:set DEFAULT_FROM_EMAIL="Rental Management System <rentalmanagement2024@gmail.com>"
```

### 3. Vercel Deployment

Add to Vercel environment variables:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=rentalmanagement2024@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
DEFAULT_FROM_EMAIL=Rental Management System <rentalmanagement2024@gmail.com>
```

### 4. DigitalOcean/VPS Deployment

Create `/home/user/.env` file:

```bash
# On your server
sudo nano /opt/rental-management/.env

# Add email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=rentalmanagement2024@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
DEFAULT_FROM_EMAIL=Rental Management System <rentalmanagement2024@gmail.com>
```

## Professional Email Services (Recommended for Production)

### 1. SendGrid (Recommended)

```bash
# SendGrid Configuration
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your-sendgrid-api-key
DEFAULT_FROM_EMAIL=Rental Management System <noreply@yourdomain.com>

# SendGrid Benefits:
# - 100 emails/day free tier
# - Better deliverability
# - Analytics and tracking
# - No daily limits on paid plans
```

### 2. Amazon SES

```bash
# Amazon SES Configuration
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=AKIA...your-access-key
EMAIL_HOST_PASSWORD=your-secret-access-key
DEFAULT_FROM_EMAIL=Rental Management System <noreply@yourdomain.com>

# SES Benefits:
# - Very low cost ($0.10 per 1000 emails)
# - High deliverability
# - Scales automatically
# - AWS integration
```

### 3. Mailgun

```bash
# Mailgun Configuration
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@yourdomain.mailgun.org
EMAIL_HOST_PASSWORD=your-mailgun-smtp-password
DEFAULT_FROM_EMAIL=Rental Management System <noreply@yourdomain.com>
```

## Security Best Practices

### 1. Environment Variable Security

```python
# settings.py - Production settings
import os
from decouple import config

# Email settings with fallbacks
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# Validation
if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    import logging
    logging.warning('Email credentials not configured. Email notifications will be disabled.')
```

### 2. Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11

# Copy environment file
COPY .env.production /app/.env

# Set environment variables
ENV DJANGO_SETTINGS_MODULE=config.settings
ENV EMAIL_HOST=smtp.gmail.com
ENV EMAIL_PORT=587
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    environment:
      - EMAIL_HOST=smtp.gmail.com
      - EMAIL_PORT=587
      - EMAIL_USE_TLS=true
      - EMAIL_HOST_USER=rentalmanagement2024@gmail.com
      - EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
    env_file:
      - .env.production
```

## Testing Email in Production

### 1. Test Email Command

```bash
# On production server
python manage.py send_test_email --email your-email@gmail.com --template welcome

# Test specific scenarios
python manage.py send_test_email --email customer@example.com --template order_confirmation
```

### 2. Health Check Endpoint

Create a health check for email service:

```python
# Add to api/utils_views.py
@api_view(['GET'])
def email_health_check(request):
    """Check if email service is working"""
    try:
        from utils.email_service import email_service
        from django.core.mail import send_mail
        
        # Try to send a test email (to admin)
        test_success = send_mail(
            'Email Service Health Check',
            'Email service is working correctly.',
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER],
            fail_silently=False,
        )
        
        return Response({
            'email_service': 'operational' if test_success else 'failed',
            'smtp_host': settings.EMAIL_HOST,
            'from_email': settings.DEFAULT_FROM_EMAIL
        })
    except Exception as e:
        return Response({
            'email_service': 'failed',
            'error': str(e)
        }, status=500)
```

## Monitoring and Logs

### 1. Email Logs

```python
# Check email logs in production
from apps.notifications.models import NotificationLog

# Recent email activity
recent_emails = NotificationLog.objects.filter(
    channel='EMAIL'
).order_by('-created_at')[:50]

# Email success rate
success_rate = NotificationLog.objects.filter(
    channel='EMAIL',
    status='SENT'
).count() / NotificationLog.objects.filter(
    channel='EMAIL'
).count() * 100
```

### 2. Error Monitoring

```python
# Add to settings.py for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'email_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/rental/email_errors.log',
        },
    },
    'loggers': {
        'utils.email_service': {
            'handlers': ['email_file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

## Quick Deployment Checklist

- [ ] Create dedicated Gmail account: `rentalmanagement2024@gmail.com`
- [ ] Enable 2-Step Verification
- [ ] Generate Gmail App Password
- [ ] Add email environment variables to deployment platform
- [ ] Test email functionality with test command
- [ ] Monitor first few emails in production
- [ ] Set up email service monitoring
- [ ] Configure backup email service (optional)

## Default Configuration Summary

**Email**: `rentalmanagement2024@gmail.com`  
**Host**: `smtp.gmail.com`  
**Port**: `587`  
**TLS**: `True`  
**Password**: Generate App Password from Google Account  

This configuration will work for initial deployment and small to medium scale usage. For high-volume production use, consider upgrading to SendGrid or Amazon SES.

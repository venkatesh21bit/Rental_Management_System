# Email Notification System Documentation

## Overview

The Rental Management System includes a comprehensive email notification service that automatically sends emails for various events in the rental lifecycle. The system uses Django's email backend with customizable HTML and text templates.

## Features

- **Automated Email Templates**: Pre-built templates for common rental scenarios
- **Bulk Email Support**: Send notifications to multiple users simultaneously
- **Celery Integration**: Asynchronous email processing with retry mechanisms
- **Comprehensive Logging**: Track all email notifications and delivery status
- **Template Customization**: Easy-to-modify email templates with context variables
- **Multi-format Support**: Both HTML and plain text email versions

## Email Templates

### 1. Order Confirmation (`order_confirmation`)
- **Trigger**: When a new rental order is created
- **Recipients**: Customer who placed the order
- **Context**: Order details, items, pickup/return dates, total amount

### 2. Pickup Reminder (`pickup_reminder`)
- **Trigger**: 24 hours before pickup date
- **Recipients**: Customer with upcoming pickup
- **Context**: Order details, pickup location, required documents

### 3. Return Reminder (`return_reminder`)
- **Trigger**: 24 hours before return date
- **Recipients**: Customer with upcoming return
- **Context**: Order details, return location, return instructions

### 4. Overdue Notice (`overdue_notice`)
- **Trigger**: When items are not returned after due date
- **Recipients**: Customer with overdue items
- **Context**: Order details, days overdue, late fees

### 5. Payment Confirmation (`payment_confirmation`)
- **Trigger**: When payment is successfully processed
- **Recipients**: Customer who made the payment
- **Context**: Payment details, transaction ID, order information

### 6. Payment Reminder (`payment_reminder`)
- **Trigger**: When payment is pending
- **Recipients**: Customer with pending payment
- **Context**: Order details, amount due, payment deadline

### 7. Quote Sent (`quote_sent`)
- **Trigger**: When a rental quote is generated
- **Recipients**: Customer who requested the quote
- **Context**: Quote details, validity period, items

### 8. Delivery Update (`delivery_update`)
- **Trigger**: When delivery status changes
- **Recipients**: Customer receiving delivery
- **Context**: Order details, delivery status, expected delivery time

### 9. Welcome Email (`welcome`)
- **Trigger**: When a new user account is created
- **Recipients**: New user
- **Context**: User details, company information, getting started guide

### 10. Password Reset (`password_reset`)
- **Trigger**: When user requests password reset
- **Recipients**: User requesting reset
- **Context**: Reset link, security instructions

## Configuration

### Environment Variables

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=Rental Management System <your-email@gmail.com>

# Company Information
COMPANY_NAME=Rental Management System
COMPANY_PHONE=+91-9876543210
COMPANY_ADDRESS=Delhi, India
WEBSITE_URL=https://rentalmanagement.com
```

### Gmail Setup

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification
   - App passwords > Select app: Mail
   - Use the generated 16-character password in `EMAIL_HOST_PASSWORD`

## Usage

### Sending Individual Emails

```python
from utils.email_service import email_service

# Send order confirmation
success = email_service.send_notification_email(
    to_email='customer@example.com',
    subject='Order Confirmation',
    template_name='order_confirmation',
    context={'order': order_data, 'user': user_data},
    user=user_instance
)
```

### Sending Bulk Emails

```python
recipients = [
    {'email': 'user1@example.com', 'user': user1, 'context': {}},
    {'email': 'user2@example.com', 'user': user2, 'context': {}}
]

stats = email_service.send_bulk_notifications(
    recipients=recipients,
    template_name='pickup_reminder',
    subject='Pickup Reminder',
    context={'global_context': 'value'}
)
```

### Using Celery Tasks

```python
from apps.notifications.tasks import send_order_confirmation_email

# Send asynchronously
send_order_confirmation_email.delay(order_id)
```

## API Endpoints

### Send Test Email
```http
POST /api/notifications/notifications/send_test_email/
Content-Type: application/json

{
    "email": "test@example.com",
    "template_name": "order_confirmation",
    "context": {"custom": "data"}
}
```

### Send Bulk Notifications
```http
POST /api/notifications/notifications/send_bulk/
Content-Type: application/json

{
    "user_ids": [1, 2, 3],
    "template_id": 1,
    "channel": "EMAIL",
    "context": {"campaign": "summer_sale"}
}
```

### Get Notification Statistics
```http
GET /api/notifications/notifications/stats/
```

## Management Commands

### Send Test Email
```bash
python manage.py send_test_email --email user@example.com --template order_confirmation
```

### With Custom Context
```bash
python manage.py send_test_email \
  --email user@example.com \
  --template pickup_reminder \
  --context '{"pickup_time": "2:00 PM"}'
```

## Automated Tasks (Celery Beat)

The system automatically runs the following tasks:

- **Daily 9:00 AM**: Check for upcoming pickups (next day)
- **Daily 9:30 AM**: Check for upcoming returns (next day)
- **Daily 10:00 AM**: Check for overdue returns

### Running Celery Worker and Beat

```bash
# Terminal 1: Start Celery worker
celery -A config worker -l info

# Terminal 2: Start Celery beat scheduler
celery -A config beat -l info
```

## Monitoring and Logging

### Notification Logs
All email notifications are logged in the `NotificationLog` model:
- User who received the notification
- Channel used (EMAIL, SMS, etc.)
- Status (SENT, FAILED, DELIVERED)
- Metadata (template used, context, etc.)

### Viewing Logs
```python
from apps.notifications.models import NotificationLog

# Recent email logs
recent_logs = NotificationLog.objects.filter(
    channel='EMAIL'
).order_by('-created_at')[:10]
```

## Error Handling

### Retry Mechanism
- Failed emails are automatically retried up to 3 times
- 60-second delay between retries
- Exponential backoff for subsequent retries

### Common Issues
1. **Invalid Email Address**: Check user email format
2. **SMTP Authentication**: Verify Gmail app password
3. **Rate Limiting**: Gmail has sending limits (500/day for free accounts)

## Customization

### Adding New Templates

1. **Add template method in EmailService**:
```python
def _render_custom_template_html(self, context):
    return """Your HTML template here"""

def _render_custom_template_text(self, context):
    return """Your text template here"""
```

2. **Update `_get_email_content` method**:
```python
email_templates['custom_template'] = {
    'html': self._render_custom_template_html(context),
    'text': self._render_custom_template_text(context)
}
```

3. **Create Celery task** (optional):
```python
@shared_task
def send_custom_email(self, user_id):
    # Implementation here
```

### Template Variables

All templates have access to:
- `user`: User object with first_name, last_name, email
- `current_year`: Current year
- `company_name`: Company name from settings
- `company_email`: Company email
- `company_phone`: Company phone
- `company_address`: Company address
- `website_url`: Website URL

## Security Considerations

1. **App Passwords**: Use Gmail app passwords, not regular passwords
2. **Environment Variables**: Never commit email credentials to version control
3. **Rate Limiting**: Implement rate limiting for bulk sends
4. **User Consent**: Ensure users have consented to receive emails
5. **Unsubscribe**: Implement unsubscribe functionality (future enhancement)

## Testing

### Unit Tests
```python
from django.test import TestCase
from utils.email_service import email_service

class EmailServiceTest(TestCase):
    def test_send_order_confirmation(self):
        success = email_service.send_notification_email(
            to_email='test@example.com',
            subject='Test',
            template_name='order_confirmation',
            context={'order': {}, 'user': {}}
        )
        self.assertTrue(success)
```

### Development Testing
```bash
# Use console backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

## Production Deployment

### Email Providers
- **Gmail**: Good for small-scale (500 emails/day)
- **SendGrid**: Professional email service
- **Amazon SES**: Scalable email service
- **Mailgun**: Developer-friendly email API

### Monitoring
- Set up email delivery monitoring
- Track bounce rates and spam reports
- Monitor email queue sizes
- Alert on failed email batches

## Future Enhancements

1. **Email Templates in Database**: Store templates in database for easy editing
2. **A/B Testing**: Test different email versions
3. **Personalization**: Advanced personalization based on user behavior
4. **Analytics**: Detailed email analytics and reporting
5. **Multi-language**: Support for multiple languages
6. **Rich Media**: Support for images and rich content
7. **Email Preferences**: User-configurable email preferences

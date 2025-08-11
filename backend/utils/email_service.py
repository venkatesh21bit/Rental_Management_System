"""
Email notification service for the rental management system.
Handles sending emails using Django's mail service with customizable templates.
"""

from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.template import Template, Context
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging
import os
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)
User = get_user_model()


class EmailService:
    """Service class for handling email notifications"""
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@rentalmanagement.com')
        self.reply_to = getattr(settings, 'DEFAULT_REPLY_TO_EMAIL', self.from_email)
    
    def send_notification_email(
        self,
        to_email: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        user: Optional[User] = None,
        notification_type: str = 'GENERAL',
        attachments: Optional[List] = None
    ) -> bool:
        """
        Send a notification email using a template
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            template_name: Name of the email template
            context: Template context variables
            user: User object (for personalization)
            notification_type: Type of notification
            attachments: List of file attachments
            
        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Prepare context
            email_context = {
                'user': user,
                'current_year': timezone.now().year,
                'company_name': getattr(settings, 'COMPANY_NAME', 'Rental Management System'),
                'company_email': self.from_email,
                'company_phone': getattr(settings, 'COMPANY_PHONE', '+91-9876543210'),
                'company_address': getattr(settings, 'COMPANY_ADDRESS', 'Delhi, India'),
                'website_url': getattr(settings, 'WEBSITE_URL', 'https://rentalmanagement.com'),
                **context
            }
            
            # Get email content based on template
            html_content, text_content = self._get_email_content(template_name, email_context)
            
            # Create email message
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=self.from_email,
                to=[to_email],
                reply_to=[self.reply_to]
            )
            
            # Attach HTML version
            if html_content:
                email.attach_alternative(html_content, "text/html")
            
            # Add attachments if any
            if attachments:
                for attachment in attachments:
                    if isinstance(attachment, dict):
                        email.attach(
                            attachment.get('filename', 'attachment'),
                            attachment.get('content', ''),
                            attachment.get('mimetype', 'application/octet-stream')
                        )
                    elif hasattr(attachment, 'read'):
                        email.attach_file(attachment.path)
            
            # Send email
            result = email.send()
            
            if result:
                logger.info(f"Email sent successfully to {to_email} - Type: {notification_type}")
                return True
            else:
                logger.error(f"Failed to send email to {to_email} - Type: {notification_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False
    
    def _get_email_content(self, template_name: str, context: Dict[str, Any]) -> tuple:
        """Get email content based on template name"""
        
        email_templates = {
            'order_confirmation': {
                'html': self._render_order_confirmation_html(context),
                'text': self._render_order_confirmation_text(context)
            },
            'pickup_reminder': {
                'html': self._render_pickup_reminder_html(context),
                'text': self._render_pickup_reminder_text(context)
            },
            'return_reminder': {
                'html': self._render_return_reminder_html(context),
                'text': self._render_return_reminder_text(context)
            },
            'overdue_notice': {
                'html': self._render_overdue_notice_html(context),
                'text': self._render_overdue_notice_text(context)
            },
            'payment_confirmation': {
                'html': self._render_payment_confirmation_html(context),
                'text': self._render_payment_confirmation_text(context)
            },
            'payment_reminder': {
                'html': self._render_payment_reminder_html(context),
                'text': self._render_payment_reminder_text(context)
            },
            'quote_sent': {
                'html': self._render_quote_sent_html(context),
                'text': self._render_quote_sent_text(context)
            },
            'delivery_update': {
                'html': self._render_delivery_update_html(context),
                'text': self._render_delivery_update_text(context)
            },
            'welcome': {
                'html': self._render_welcome_html(context),
                'text': self._render_welcome_text(context)
            },
            'password_reset': {
                'html': self._render_password_reset_html(context),
                'text': self._render_password_reset_text(context)
            }
        }
        
        template = email_templates.get(template_name, {})
        return template.get('html', ''), template.get('text', '')
    
    def _render_order_confirmation_html(self, context: Dict[str, Any]) -> str:
        """Render order confirmation email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #007bff; }}
                .order-details {{ background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .item {{ border-bottom: 1px solid #dee2e6; padding: 10px 0; }}
                .item:last-child {{ border-bottom: none; }}
                .total {{ font-weight: bold; font-size: 18px; color: #007bff; text-align: right; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
                .button {{ display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name', 'Rental Management System')}</div>
                    <h2>Order Confirmation</h2>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <p>Thank you for your order! We're excited to confirm that your rental order has been successfully placed.</p>
                
                <div class="order-details">
                    <h3>Order Details</h3>
                    <p><strong>Order ID:</strong> {context.get('order', {}).get('id', 'N/A')}</p>
                    <p><strong>Order Date:</strong> {context.get('order', {}).get('created_at', 'N/A')}</p>
                    <p><strong>Pickup Date:</strong> {context.get('order', {}).get('start_date', 'N/A')}</p>
                    <p><strong>Return Date:</strong> {context.get('order', {}).get('end_date', 'N/A')}</p>
                    
                    <h4>Rental Items:</h4>
                    {self._render_order_items(context.get('order', {}).get('items', []))}
                    
                    <div class="total">
                        Total Amount: ₹{context.get('order', {}).get('total_amount', '0.00')}
                    </div>
                </div>
                
                <p>We'll send you a pickup reminder closer to your rental start date. If you have any questions, please don't hesitate to contact us.</p>
                
                <a href="{context.get('website_url')}/orders/{context.get('order', {}).get('id')}" class="button">View Order Details</a>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>{context.get('company_address')}</p>
                    <p>Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                    <p>&copy; {context.get('current_year')} {context.get('company_name')}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_order_confirmation_text(self, context: Dict[str, Any]) -> str:
        """Render order confirmation email text"""
        order = context.get('order', {})
        user = context.get('user', {})
        
        return f"""
Order Confirmation - {context.get('company_name')}

Dear {user.get('first_name', 'Valued Customer')},

Thank you for your order! We're excited to confirm that your rental order has been successfully placed.

Order Details:
- Order ID: {order.get('id', 'N/A')}
- Order Date: {order.get('created_at', 'N/A')}
- Pickup Date: {order.get('start_date', 'N/A')}
- Return Date: {order.get('end_date', 'N/A')}
- Total Amount: ₹{order.get('total_amount', '0.00')}

We'll send you a pickup reminder closer to your rental start date. If you have any questions, please don't hesitate to contact us.

View your order details: {context.get('website_url')}/orders/{order.get('id')}

Best regards,
{context.get('company_name')}
{context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_pickup_reminder_html(self, context: Dict[str, Any]) -> str:
        """Render pickup reminder email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pickup Reminder</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #28a745; }}
                .reminder-box {{ background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .important {{ color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
                .button {{ display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>🚚 Pickup Reminder</h2>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <div class="reminder-box">
                    <h3>Your rental pickup is scheduled for tomorrow!</h3>
                    <p><strong>Order ID:</strong> {context.get('order', {}).get('id')}</p>
                    <p><strong>Pickup Date:</strong> {context.get('order', {}).get('start_date')}</p>
                    <p><strong>Pickup Time:</strong> {context.get('pickup_time', '10:00 AM - 6:00 PM')}</p>
                    <p><strong>Pickup Location:</strong> {context.get('pickup_address', 'Our store location')}</p>
                </div>
                
                <div class="important">
                    <strong>What to bring:</strong>
                    <ul>
                        <li>Valid photo ID (Driving License/Aadhar Card)</li>
                        <li>Order confirmation (this email or SMS)</li>
                        <li>Security deposit (if applicable)</li>
                    </ul>
                </div>
                
                <p>Please arrive on time for your pickup. If you need to reschedule, contact us at least 2 hours before your scheduled time.</p>
                
                <a href="{context.get('website_url')}/orders/{context.get('order', {}).get('id')}" class="button">View Order Details</a>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_pickup_reminder_text(self, context: Dict[str, Any]) -> str:
        """Render pickup reminder email text"""
        return f"""
Pickup Reminder - {context.get('company_name')}

Dear {context.get('user', {}).get('first_name', 'Valued Customer')},

Your rental pickup is scheduled for tomorrow!

Order Details:
- Order ID: {context.get('order', {}).get('id')}
- Pickup Date: {context.get('order', {}).get('start_date')}
- Pickup Time: {context.get('pickup_time', '10:00 AM - 6:00 PM')}
- Pickup Location: {context.get('pickup_address', 'Our store location')}

What to bring:
- Valid photo ID (Driving License/Aadhar Card)
- Order confirmation
- Security deposit (if applicable)

Please arrive on time for your pickup. If you need to reschedule, contact us at least 2 hours before your scheduled time.

Contact us: {context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_return_reminder_html(self, context: Dict[str, Any]) -> str:
        """Render return reminder email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Return Reminder</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #ffc107; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #ffc107; }}
                .reminder-box {{ background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
                .button {{ display: inline-block; background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>📦 Return Reminder</h2>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <div class="reminder-box">
                    <h3>Your rental return is due tomorrow!</h3>
                    <p><strong>Order ID:</strong> {context.get('order', {}).get('id')}</p>
                    <p><strong>Return Date:</strong> {context.get('order', {}).get('end_date')}</p>
                    <p><strong>Return Time:</strong> {context.get('return_time', '10:00 AM - 6:00 PM')}</p>
                    <p><strong>Return Location:</strong> {context.get('return_address', 'Our store location')}</p>
                </div>
                
                <p>Please ensure all items are returned in good condition to avoid any additional charges. Late returns may incur additional fees.</p>
                
                <a href="{context.get('website_url')}/orders/{context.get('order', {}).get('id')}" class="button">View Order Details</a>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_return_reminder_text(self, context: Dict[str, Any]) -> str:
        """Render return reminder email text"""
        return f"""
Return Reminder - {context.get('company_name')}

Dear {context.get('user', {}).get('first_name', 'Valued Customer')},

Your rental return is due tomorrow!

Return Details:
- Order ID: {context.get('order', {}).get('id')}
- Return Date: {context.get('order', {}).get('end_date')}
- Return Time: {context.get('return_time', '10:00 AM - 6:00 PM')}
- Return Location: {context.get('return_address', 'Our store location')}

Please ensure all items are returned in good condition to avoid any additional charges. Late returns may incur additional fees.

Contact us: {context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_overdue_notice_html(self, context: Dict[str, Any]) -> str:
        """Render overdue notice email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Overdue Notice</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #dc3545; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #dc3545; }}
                .overdue-box {{ background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .urgent {{ color: #721c24; font-weight: bold; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
                .button {{ display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>⚠️ URGENT: Overdue Return Notice</h2>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <div class="overdue-box">
                    <h3 class="urgent">Your rental items are overdue!</h3>
                    <p><strong>Order ID:</strong> {context.get('order', {}).get('id')}</p>
                    <p><strong>Original Return Date:</strong> {context.get('order', {}).get('end_date')}</p>
                    <p><strong>Days Overdue:</strong> {context.get('days_overdue', 'N/A')}</p>
                    <p><strong>Late Fee Incurred:</strong> ₹{context.get('late_fee', '0.00')}</p>
                </div>
                
                <p class="urgent">Please return the rental items immediately to avoid additional late fees. Each additional day will incur extra charges.</p>
                
                <p>If you have already returned the items, please contact us immediately with your return receipt.</p>
                
                <a href="tel:{context.get('company_phone').replace(' ', '').replace('-', '')}" class="button">Call Us Now</a>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p><strong>URGENT:</strong> Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_overdue_notice_text(self, context: Dict[str, Any]) -> str:
        """Render overdue notice email text"""
        return f"""
URGENT: Overdue Return Notice - {context.get('company_name')}

Dear {context.get('user', {}).get('first_name', 'Valued Customer')},

Your rental items are overdue!

Overdue Details:
- Order ID: {context.get('order', {}).get('id')}
- Original Return Date: {context.get('order', {}).get('end_date')}
- Days Overdue: {context.get('days_overdue', 'N/A')}
- Late Fee Incurred: ₹{context.get('late_fee', '0.00')}

Please return the rental items immediately to avoid additional late fees. Each additional day will incur extra charges.

If you have already returned the items, please contact us immediately with your return receipt.

URGENT Contact: {context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_payment_confirmation_html(self, context: Dict[str, Any]) -> str:
        """Render payment confirmation email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Confirmation</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #28a745; }}
                .success-box {{ background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }}
                .payment-details {{ background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>✅ Payment Confirmation</h2>
                </div>
                
                <div class="success-box">
                    <h3>Payment Successful!</h3>
                    <p>Thank you for your payment. Your transaction has been processed successfully.</p>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <div class="payment-details">
                    <h4>Payment Details</h4>
                    <p><strong>Transaction ID:</strong> {context.get('payment', {}).get('transaction_id', 'N/A')}</p>
                    <p><strong>Order ID:</strong> {context.get('order', {}).get('id', 'N/A')}</p>
                    <p><strong>Amount Paid:</strong> ₹{context.get('payment', {}).get('amount', '0.00')}</p>
                    <p><strong>Payment Method:</strong> {context.get('payment', {}).get('method', 'N/A')}</p>
                    <p><strong>Payment Date:</strong> {context.get('payment', {}).get('created_at', 'N/A')}</p>
                </div>
                
                <p>A receipt for this payment has been generated and is available in your account dashboard.</p>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_payment_confirmation_text(self, context: Dict[str, Any]) -> str:
        """Render payment confirmation email text"""
        return f"""
Payment Confirmation - {context.get('company_name')}

Dear {context.get('user', {}).get('first_name', 'Valued Customer')},

Payment Successful!

Payment Details:
- Transaction ID: {context.get('payment', {}).get('transaction_id', 'N/A')}
- Order ID: {context.get('order', {}).get('id', 'N/A')}
- Amount Paid: ₹{context.get('payment', {}).get('amount', '0.00')}
- Payment Method: {context.get('payment', {}).get('method', 'N/A')}
- Payment Date: {context.get('payment', {}).get('created_at', 'N/A')}

A receipt for this payment has been generated and is available in your account dashboard.

Contact us: {context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_payment_reminder_html(self, context: Dict[str, Any]) -> str:
        """Render payment reminder email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Reminder</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #ffc107; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #ffc107; }}
                .reminder-box {{ background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
                .button {{ display: inline-block; background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>💳 Payment Reminder</h2>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <div class="reminder-box">
                    <h3>Payment Due</h3>
                    <p>We noticed that payment for your order is still pending. Please complete your payment to confirm your rental booking.</p>
                    <p><strong>Order ID:</strong> {context.get('order', {}).get('id')}</p>
                    <p><strong>Amount Due:</strong> ₹{context.get('amount_due', '0.00')}</p>
                    <p><strong>Due Date:</strong> {context.get('due_date', 'N/A')}</p>
                </div>
                
                <p>You can make the payment online through our secure payment gateway.</p>
                
                <a href="{context.get('website_url')}/orders/{context.get('order', {}).get('id')}/pay" class="button">Pay Now</a>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_payment_reminder_text(self, context: Dict[str, Any]) -> str:
        """Render payment reminder email text"""
        return f"""
Payment Reminder - {context.get('company_name')}

Dear {context.get('user', {}).get('first_name', 'Valued Customer')},

Payment Due

We noticed that payment for your order is still pending. Please complete your payment to confirm your rental booking.

Payment Details:
- Order ID: {context.get('order', {}).get('id')}
- Amount Due: ₹{context.get('amount_due', '0.00')}
- Due Date: {context.get('due_date', 'N/A')}

You can make the payment online: {context.get('website_url')}/orders/{context.get('order', {}).get('id')}/pay

Contact us: {context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_quote_sent_html(self, context: Dict[str, Any]) -> str:
        """Render quote sent email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quote Sent</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #007bff; }}
                .quote-box {{ background-color: #e3f2fd; border: 1px solid #bbdefb; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
                .button {{ display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>📋 Your Rental Quote</h2>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <div class="quote-box">
                    <h3>Quote Details</h3>
                    <p>Thank you for your interest in our rental services. Please find your personalized quote below:</p>
                    <p><strong>Quote ID:</strong> {context.get('quote', {}).get('id')}</p>
                    <p><strong>Valid Until:</strong> {context.get('quote', {}).get('valid_until')}</p>
                    <p><strong>Total Amount:</strong> ₹{context.get('quote', {}).get('total_amount', '0.00')}</p>
                </div>
                
                <p>This quote is valid for 7 days. You can review the details and confirm your booking by clicking the button below.</p>
                
                <a href="{context.get('website_url')}/quotes/{context.get('quote', {}).get('id')}" class="button">View & Confirm Quote</a>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_quote_sent_text(self, context: Dict[str, Any]) -> str:
        """Render quote sent email text"""
        return f"""
Your Rental Quote - {context.get('company_name')}

Dear {context.get('user', {}).get('first_name', 'Valued Customer')},

Thank you for your interest in our rental services. Please find your personalized quote below:

Quote Details:
- Quote ID: {context.get('quote', {}).get('id')}
- Valid Until: {context.get('quote', {}).get('valid_until')}
- Total Amount: ₹{context.get('quote', {}).get('total_amount', '0.00')}

This quote is valid for 7 days. You can review the details and confirm your booking online.

View quote: {context.get('website_url')}/quotes/{context.get('quote', {}).get('id')}

Contact us: {context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_delivery_update_html(self, context: Dict[str, Any]) -> str:
        """Render delivery update email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Delivery Update</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #17a2b8; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #17a2b8; }}
                .update-box {{ background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>🚚 Delivery Update</h2>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <div class="update-box">
                    <h3>Delivery Status Update</h3>
                    <p><strong>Order ID:</strong> {context.get('order', {}).get('id')}</p>
                    <p><strong>Status:</strong> {context.get('delivery_status', 'In Transit')}</p>
                    <p><strong>Update:</strong> {context.get('delivery_message', 'Your order is on the way.')}</p>
                    <p><strong>Expected Delivery:</strong> {context.get('expected_delivery', 'As scheduled')}</p>
                </div>
                
                <p>We'll keep you updated as your delivery progresses. Thank you for choosing our rental service!</p>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_delivery_update_text(self, context: Dict[str, Any]) -> str:
        """Render delivery update email text"""
        return f"""
Delivery Update - {context.get('company_name')}

Dear {context.get('user', {}).get('first_name', 'Valued Customer')},

Delivery Status Update:
- Order ID: {context.get('order', {}).get('id')}
- Status: {context.get('delivery_status', 'In Transit')}
- Update: {context.get('delivery_message', 'Your order is on the way.')}
- Expected Delivery: {context.get('expected_delivery', 'As scheduled')}

We'll keep you updated as your delivery progresses. Thank you for choosing our rental service!

Contact us: {context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_welcome_html(self, context: Dict[str, Any]) -> str:
        """Render welcome email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #28a745; }}
                .welcome-box {{ background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }}
                .features {{ background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
                .button {{ display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>🎉 Welcome!</h2>
                </div>
                
                <div class="welcome-box">
                    <h3>Welcome to {context.get('company_name')}!</h3>
                    <p>Thank you for joining our rental community. We're excited to help you with all your rental needs.</p>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'Valued Customer')},</p>
                
                <p>Your account has been successfully created. You now have access to our wide range of rental products and services.</p>
                
                <div class="features">
                    <h4>What you can do:</h4>
                    <ul>
                        <li>Browse our extensive product catalog</li>
                        <li>Get instant quotes and pricing</li>
                        <li>Book rentals online</li>
                        <li>Track your orders</li>
                        <li>Manage your account</li>
                    </ul>
                </div>
                
                <a href="{context.get('website_url')}/catalog" class="button">Start Browsing</a>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>Phone: {context.get('company_phone')} | Email: {context.get('company_email')}</p>
                    <p>Welcome to the family!</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_welcome_text(self, context: Dict[str, Any]) -> str:
        """Render welcome email text"""
        return f"""
Welcome to {context.get('company_name')}!

Dear {context.get('user', {}).get('first_name', 'Valued Customer')},

Thank you for joining our rental community. We're excited to help you with all your rental needs.

Your account has been successfully created. You now have access to our wide range of rental products and services.

What you can do:
- Browse our extensive product catalog
- Get instant quotes and pricing  
- Book rentals online
- Track your orders
- Manage your account

Start browsing: {context.get('website_url')}/catalog

Welcome to the family!
Contact us: {context.get('company_phone')} | {context.get('company_email')}
        """
    
    def _render_password_reset_html(self, context: Dict[str, Any]) -> str:
        """Render password reset email HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; border-bottom: 2px solid #dc3545; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #dc3545; }}
                .security-box {{ background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; }}
                .button {{ display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">{context.get('company_name')}</div>
                    <h2>🔐 Password Reset</h2>
                </div>
                
                <p>Dear {context.get('user', {}).get('first_name', 'User')},</p>
                
                <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
                
                <div class="security-box">
                    <h4>Reset Your Password</h4>
                    <p>Click the button below to reset your password. This link will expire in 24 hours for security reasons.</p>
                    <a href="{context.get('reset_url', '#')}" class="button">Reset Password</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #007bff;">{context.get('reset_url', '#')}</p>
                
                <p>For security reasons, this link will expire in 24 hours.</p>
                
                <div class="footer">
                    <p><strong>{context.get('company_name')}</strong></p>
                    <p>If you didn't request this, please contact us: {context.get('company_email')}</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _render_password_reset_text(self, context: Dict[str, Any]) -> str:
        """Render password reset email text"""
        return f"""
Password Reset - {context.get('company_name')}

Dear {context.get('user', {}).get('first_name', 'User')},

We received a request to reset your password. If you didn't make this request, please ignore this email.

Reset Your Password:
{context.get('reset_url', '#')}

For security reasons, this link will expire in 24 hours.

If you didn't request this, please contact us: {context.get('company_email')}

{context.get('company_name')}
        """
    
    def _render_order_items(self, items: List) -> str:
        """Render order items HTML"""
        if not items:
            return "<p>No items found.</p>"
        
        html = ""
        for item in items:
            html += f"""
            <div class="item">
                <strong>{item.get('product_name', 'Product')}</strong><br>
                Quantity: {item.get('quantity', 1)} | 
                Rate: ₹{item.get('rate', '0.00')}/day | 
                Subtotal: ₹{item.get('subtotal', '0.00')}
            </div>
            """
        return html
    
    def send_bulk_notifications(
        self,
        recipients: List[Dict[str, Any]],
        template_name: str,
        subject: str,
        context: Dict[str, Any]
    ) -> Dict[str, int]:
        """
        Send bulk email notifications
        
        Args:
            recipients: List of recipient dictionaries with 'email' and optional 'user'
            template_name: Name of the email template
            subject: Email subject
            context: Base template context
            
        Returns:
            dict: Statistics of sent emails
        """
        stats = {'sent': 0, 'failed': 0, 'total': len(recipients)}
        
        for recipient in recipients:
            email = recipient.get('email')
            user = recipient.get('user')
            
            if not email:
                stats['failed'] += 1
                continue
            
            # Merge recipient-specific context
            recipient_context = {**context, **recipient.get('context', {})}
            
            success = self.send_notification_email(
                to_email=email,
                subject=subject,
                template_name=template_name,
                context=recipient_context,
                user=user
            )
            
            if success:
                stats['sent'] += 1
            else:
                stats['failed'] += 1
        
        logger.info(f"Bulk email completed. Sent: {stats['sent']}, Failed: {stats['failed']}")
        return stats


# Create a global instance
email_service = EmailService()

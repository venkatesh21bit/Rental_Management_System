"""
Industry-grade email templates for payment notifications
Professional HTML templates with responsive design
"""

PAYMENT_SUCCESS_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .success-icon {
            text-align: center;
            margin-bottom: 30px;
        }
        .success-icon svg {
            width: 64px;
            height: 64px;
            fill: #28a745;
        }
        .payment-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #28a745;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #6c757d;
        }
        .detail-value {
            color: #495057;
            font-weight: 500;
        }
        .amount {
            font-size: 18px;
            font-weight: 700;
            color: #28a745;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: 500;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            .content, .header, .footer {
                padding: 20px !important;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Confirmed</h1>
        </div>
        
        <div class="content">
            <div class="success-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
            </div>
            
            <h2>Thank you for your payment!</h2>
            <p>Your payment has been successfully processed. Here are the details of your transaction:</p>
            
            <div class="payment-details">
                <div class="detail-row">
                    <span class="detail-label">Payment Number:</span>
                    <span class="detail-value">{{ payment.payment_number }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value amount">{{ currency }} {{ amount }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">{{ payment.payment_method|title }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transaction Date:</span>
                    <span class="detail-value">{{ payment.paid_at|date:"F d, Y H:i" }}</span>
                </div>
                {% if payment.invoice %}
                <div class="detail-row">
                    <span class="detail-label">Invoice Number:</span>
                    <span class="detail-value">{{ payment.invoice.invoice_number }}</span>
                </div>
                {% endif %}
            </div>
            
            <p>A receipt has been sent to your email address. If you have any questions about this payment, please contact our support team.</p>
            
            <div style="text-align: center;">
                <a href="#" class="btn">View Payment Details</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

PAYMENT_FAILED_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .error-icon {
            text-align: center;
            margin-bottom: 30px;
        }
        .error-icon svg {
            width: 64px;
            height: 64px;
            fill: #dc3545;
        }
        .payment-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #dc3545;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #6c757d;
        }
        .detail-value {
            color: #495057;
            font-weight: 500;
        }
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #f5c6cb;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: 500;
        }
        .btn-retry {
            background-color: #28a745;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            .content, .header, .footer {
                padding: 20px !important;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Failed</h1>
        </div>
        
        <div class="content">
            <div class="error-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </div>
            
            <h2>Payment Processing Failed</h2>
            <p>We were unable to process your payment. Please review the details below and try again.</p>
            
            <div class="error-message">
                <strong>Error:</strong> {{ failure_reason }}
            </div>
            
            <div class="payment-details">
                <div class="detail-row">
                    <span class="detail-label">Payment Number:</span>
                    <span class="detail-value">{{ payment.payment_number }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">{{ payment.currency }} {{ payment.amount }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">{{ payment.payment_method|title }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Attempt Date:</span>
                    <span class="detail-value">{{ payment.created_at|date:"F d, Y H:i" }}</span>
                </div>
            </div>
            
            <p><strong>What to do next:</strong></p>
            <ul>
                <li>Check that your payment information is correct</li>
                <li>Ensure your account has sufficient funds</li>
                <li>Contact your bank if the issue persists</li>
                <li>Try using a different payment method</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="#" class="btn btn-retry">Try Payment Again</a>
                <a href="#" class="btn">Contact Support</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Need help? Contact our support team at support@example.com</p>
            <p>&copy; 2024 Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

REFUND_CONFIRMATION_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Processed</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .refund-icon {
            text-align: center;
            margin-bottom: 30px;
        }
        .refund-icon svg {
            width: 64px;
            height: 64px;
            fill: #17a2b8;
        }
        .payment-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #17a2b8;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #6c757d;
        }
        .detail-value {
            color: #495057;
            font-weight: 500;
        }
        .amount {
            font-size: 18px;
            font-weight: 700;
            color: #17a2b8;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        }
        .info-box {
            background-color: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #bee5eb;
            margin: 20px 0;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            .content, .header, .footer {
                padding: 20px !important;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Refund Processed</h1>
        </div>
        
        <div class="content">
            <div class="refund-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                </svg>
            </div>
            
            <h2>Your refund has been processed</h2>
            <p>We have successfully processed your refund request. The money will be returned to your original payment method.</p>
            
            <div class="payment-details">
                <div class="detail-row">
                    <span class="detail-label">Original Payment:</span>
                    <span class="detail-value">{{ payment.payment_number }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Refund Amount:</span>
                    <span class="detail-value amount">{{ currency }} {{ refunded_amount }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Refund Method:</span>
                    <span class="detail-value">{{ payment.payment_method|title }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Processed Date:</span>
                    <span class="detail-value">{{ "now"|date:"F d, Y H:i" }}</span>
                </div>
            </div>
            
            <div class="info-box">
                <strong>Please note:</strong> Depending on your bank or payment provider, it may take 3-10 business days for the refund to appear in your account.
            </div>
            
            <p>If you have any questions about this refund, please don't hesitate to contact our customer support team.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

DISPUTE_NOTIFICATION_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Dispute Alert</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
            color: #212529;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .warning-icon {
            text-align: center;
            margin-bottom: 30px;
        }
        .warning-icon svg {
            width: 64px;
            height: 64px;
            fill: #ffc107;
        }
        .dispute-details {
            background-color: #fff3cd;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #ffc107;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #ffeaa7;
        }
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #856404;
        }
        .detail-value {
            color: #533f03;
            font-weight: 500;
        }
        .amount {
            font-size: 18px;
            font-weight: 700;
            color: #dc3545;
        }
        .urgent {
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #f5c6cb;
            margin: 20px 0;
            font-weight: 600;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: 500;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            .content, .header, .footer {
                padding: 20px !important;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Dispute Alert</h1>
        </div>
        
        <div class="content">
            <div class="warning-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
            </div>
            
            <div class="urgent">
                URGENT: A payment dispute has been created and requires immediate attention.
            </div>
            
            <h2>Payment Dispute Created</h2>
            <p>A customer has initiated a dispute for the following payment. Please review and take appropriate action within the required timeframe.</p>
            
            <div class="dispute-details">
                <div class="detail-row">
                    <span class="detail-label">Payment Number:</span>
                    <span class="detail-value">{{ payment.payment_number }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Dispute Amount:</span>
                    <span class="detail-value amount">${{ dispute_amount }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Dispute Reason:</span>
                    <span class="detail-value">{{ dispute_reason|title }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Customer:</span>
                    <span class="detail-value">{{ payment.customer.email }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Date:</span>
                    <span class="detail-value">{{ payment.paid_at|date:"F d, Y" }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Dispute Date:</span>
                    <span class="detail-value">{{ "now"|date:"F d, Y H:i" }}</span>
                </div>
            </div>
            
            <p><strong>Required Actions:</strong></p>
            <ul>
                <li>Review the transaction details and customer communications</li>
                <li>Gather supporting documentation (receipts, delivery confirmations, etc.)</li>
                <li>Respond to the dispute through your payment processor dashboard</li>
                <li>Contact the customer to attempt resolution</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="#" class="btn">View Dispute Details</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Time Sensitive:</strong> Most disputes must be responded to within 7-14 days.</p>
            <p>&copy; 2024 Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

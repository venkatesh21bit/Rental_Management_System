#!/bin/bash
# Railway Deployment Setup Script
# Run this after setting up your Railway project

echo "🚀 Railway Deployment Setup for Rental Management System"
echo "======================================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"

# Login to Railway
echo "📝 Please login to Railway..."
railway login

# Link to your Railway project
echo "🔗 Please link to your Railway project..."
railway link

# Add PostgreSQL service
echo "🐘 Adding PostgreSQL service..."
railway add --service postgresql

# Add Redis service
echo "🔴 Adding Redis service..."
railway add --service redis

# Set environment variables
echo "⚙️  Setting environment variables..."

# Essential variables
railway variables set SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(50))')"
railway variables set DEBUG=False
railway variables set ALLOWED_HOSTS="*.railway.app"

# Email configuration
railway variables set EMAIL_HOST=smtp.gmail.com
railway variables set EMAIL_PORT=587
railway variables set EMAIL_USE_TLS=True
railway variables set EMAIL_HOST_USER=rentalmanagement2024@gmail.com

# Company information
railway variables set COMPANY_NAME="Rental Management System"
railway variables set COMPANY_PHONE="+91-9876543210"
railway variables set COMPANY_ADDRESS="Delhi, India"

# JWT settings
railway variables set JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
railway variables set JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# CORS settings
railway variables set CORS_ALLOW_ALL_ORIGINS=False

echo "✅ Basic variables set successfully!"
echo ""
echo "🔧 Manual steps required:"
echo "1. Set EMAIL_HOST_PASSWORD with your Gmail App Password"
echo "2. Update WEBSITE_URL with your Railway domain"
echo "3. Update ALLOWED_HOSTS with your custom domain (if any)"
echo ""
echo "📧 Gmail App Password Setup:"
echo "1. Go to https://myaccount.google.com/security"
echo "2. Enable 2-Step Verification"
echo "3. Generate App Password for Mail"
echo "4. Run: railway variables set EMAIL_HOST_PASSWORD=your-app-password"
echo ""
echo "🌐 Update domain after deployment:"
echo "railway variables set WEBSITE_URL=https://your-app.railway.app"
echo "railway variables set ALLOWED_HOSTS=your-app.railway.app"
echo ""
echo "🚀 Deploy your application:"
echo "railway up"

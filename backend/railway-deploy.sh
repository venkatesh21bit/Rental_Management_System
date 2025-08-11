#!/bin/bash
# Railway Deployment Script for Rental Management System

echo "🚀 Starting Railway Deployment Setup..."

# Step 1: Install Railway CLI (if not installed)
echo "📦 Installing Railway CLI..."
npm install -g @railway/cli

# Step 2: Login to Railway
echo "🔐 Please login to Railway..."
railway login

# Step 3: Create new project or link existing
echo "🔗 Linking to Railway project..."
echo "If this is a new project, run: railway init"
echo "If you have an existing project, run: railway link"
read -p "Press Enter after linking your project..."

# Step 4: Add PostgreSQL service
echo "🗄️ Adding PostgreSQL database..."
railway add postgresql

# Step 5: Add Redis service
echo "🔴 Adding Redis cache..."
railway add redis

# Step 6: Set environment variables
echo "⚙️ Setting environment variables..."

# Core Django settings
railway variables set SECRET_KEY="qlrNnmrUuFtvWdz9j6VBi0kbIyOLvw3EjdjkJqvKDBsO8sSVRWrps5ziymj3vvCcbPw"
railway variables set DEBUG="False"
railway variables set ALLOWED_HOSTS="*"  # Railway will auto-configure the domain

# Email configuration (you'll need to update these)
railway variables set EMAIL_HOST="smtp.gmail.com"
railway variables set EMAIL_PORT="587"
railway variables set EMAIL_USE_TLS="True"
railway variables set EMAIL_HOST_USER="your-email@gmail.com"
railway variables set EMAIL_HOST_PASSWORD="your-16-character-app-password"
railway variables set DEFAULT_FROM_EMAIL="Rental Management System <your-email@gmail.com>"

# Company information
railway variables set COMPANY_NAME="Rental Management System"
railway variables set COMPANY_PHONE="+91-1234567890"
railway variables set COMPANY_ADDRESS="Your City, Your Country"

# JWT configuration
railway variables set JWT_ACCESS_TOKEN_LIFETIME_MINUTES="60"
railway variables set JWT_REFRESH_TOKEN_LIFETIME_DAYS="7"

# CORS configuration
railway variables set CORS_ALLOW_ALL_ORIGINS="False"

echo "✅ Environment variables set!"

# Step 7: Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "🎉 Deployment initiated!"
echo ""
echo "📋 Next Steps:"
echo "1. Wait for deployment to complete"
echo "2. Get your app URL from Railway dashboard"
echo "3. Update EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in Railway variables"
echo "4. Set up payment gateway keys (Stripe, Razorpay) in Railway variables"
echo "5. Run database migrations (Railway will do this automatically)"
echo "6. Create superuser if needed"
echo ""
echo "🌐 Your app will be available at: https://your-project.railway.app"

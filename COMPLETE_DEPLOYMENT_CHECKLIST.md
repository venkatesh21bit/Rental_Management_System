# 🚀 Complete Deployment Checklist & Setup Guide

## 📋 Current Project Status

✅ **Backend**: Fully developed with comprehensive admin interfaces
✅ **Frontend**: Next.js application with modern UI components
✅ **API**: Complete REST API with DRF Spectacular documentation
✅ **Admin System**: 60+ models with professional admin interfaces
✅ **Email System**: Configured and ready
⚠️ **Deployment**: Needs final environment setup

## 🎯 DEPLOYMENT STEPS

### STEP 1: Fix Current Issues

#### A. Generate Production Secret Key
```bash
# Run this in Python to generate a secure SECRET_KEY
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(50))"
```

#### B. Fix WebhookEventViewSet Issue
The DRF Spectacular error needs to be resolved.

### STEP 2: Environment Variables Setup

#### A. Backend Environment Variables (.env.production)
```bash
# === CORE DJANGO SETTINGS ===
SECRET_KEY=your-generated-50-character-secret-key-from-step-1
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com,your-app.railway.app

# === DATABASE ===
DATABASE_URL=postgresql://user:password@host:port/dbname
# OR individual settings:
DB_NAME=rental_management_db
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# === EMAIL CONFIGURATION ===
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
DEFAULT_FROM_EMAIL=Rental Management System <your-email@gmail.com>
DEFAULT_REPLY_TO_EMAIL=your-email@gmail.com

# === COMPANY INFORMATION ===
COMPANY_NAME=Rental Management System
COMPANY_PHONE=+91-1234567890
COMPANY_ADDRESS=Your City, Your State, Your Country
WEBSITE_URL=https://yourdomain.com

# === REDIS & CELERY ===
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# === JWT CONFIGURATION ===
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# === CORS SETTINGS ===
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://your-frontend.vercel.app

# === PAYMENT GATEWAYS ===
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=live  # or sandbox for testing
```

#### B. Frontend Environment Variables (.env.local)
```bash
# === API CONFIGURATION ===
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend.vercel.app

# === PAYMENT KEYS (PUBLIC) ===
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id

# === COMPANY INFO ===
NEXT_PUBLIC_COMPANY_NAME=Rental Management System
NEXT_PUBLIC_COMPANY_PHONE=+91-1234567890
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
```

### STEP 3: Gmail App Password Setup

1. **Create/Use Gmail Account**:
   - Go to [Gmail](https://accounts.google.com)
   - Use existing or create: `yourcompany.rentals@gmail.com`

2. **Enable 2-Factor Authentication**:
   - Google Account → Security → 2-Step Verification → Enable

3. **Generate App Password**:
   - Google Account → Security → 2-Step Verification
   - App passwords → Select app: Mail → Select device: Other
   - Enter name: "Rental Management System"
   - Copy the 16-character password
   - Use this in `EMAIL_HOST_PASSWORD`

### STEP 4: Database Setup

#### Option A: PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL locally or use cloud service
createdb rental_management_db
psql rental_management_db

# Or use Railway/Heroku/AWS RDS PostgreSQL
```

#### Option B: SQLite (Development Only)
Your current setup uses SQLite - fine for development but not production.

### STEP 5: Payment Gateway Setup

#### A. Stripe Setup
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your **Publishable Key** and **Secret Key**
3. Set up **Webhooks**:
   - Endpoint: `https://your-api.railway.app/api/payments/stripe/webhook/`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

#### B. Razorpay Setup
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Get your **Key ID** and **Key Secret**
3. Set up **Webhooks**:
   - Endpoint: `https://your-api.railway.app/api/payments/razorpay/webhook/`

### STEP 6: Deployment Platforms

#### Backend Deployment Options:

##### Option A: Railway (Recommended)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and connect
railway login
railway link

# 3. Add services
railway add postgresql
railway add redis

# 4. Set environment variables in Railway dashboard
# 5. Deploy
railway up
```

##### Option B: Heroku
```bash
# 1. Install Heroku CLI
# 2. Create app
heroku create your-rental-api

# 3. Add addons
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# 4. Set config vars
heroku config:set SECRET_KEY=your-secret-key
# ... add all environment variables

# 5. Deploy
git push heroku main
```

##### Option C: DigitalOcean App Platform
1. Connect GitHub repository
2. Configure build settings
3. Add PostgreSQL and Redis databases
4. Set environment variables

#### Frontend Deployment Options:

##### Option A: Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy from frontend directory
cd frontend
vercel

# 3. Set environment variables in Vercel dashboard
```

##### Option B: Netlify
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables

### STEP 7: Domain Setup (Optional)

#### A. Custom Domain
1. **Buy Domain**: GoDaddy, Namecheap, etc.
2. **Configure DNS**:
   - API subdomain: `api.yourdomain.com` → Railway/Heroku app
   - Frontend: `yourdomain.com` → Vercel/Netlify app

#### B. SSL Certificates
- Railway/Vercel/Netlify provide automatic SSL
- For custom setups, use Let's Encrypt

### STEP 8: Final Setup Commands

#### A. Database Migration & Setup
```bash
# On your production server/platform
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
python manage.py seed_comprehensive_data  # Your custom command
```

#### B. Test Deployment
```bash
# Health check
curl https://your-api.railway.app/health/

# API documentation
curl https://your-api.railway.app/api/docs/

# Admin panel
https://your-api.railway.app/admin/
```

## 🔧 IMMEDIATE ACTION ITEMS

### Priority 1: Fix Current Issues
1. **Generate secure SECRET_KEY**
2. **Fix WebhookEventViewSet DRF Spectacular error**
3. **Set DEBUG=False for production**

### Priority 2: Environment Setup
1. **Create .env.production file with all variables**
2. **Set up Gmail App Password**
3. **Choose deployment platform**

### Priority 3: Payment Setup
1. **Create Stripe account and get keys**
2. **Create Razorpay account and get keys**
3. **Set up webhook endpoints**

### Priority 4: Deploy
1. **Deploy backend to Railway/Heroku**
2. **Deploy frontend to Vercel/Netlify**
3. **Configure custom domain (optional)**

## 🚨 SECURITY CHECKLIST

- [ ] SECRET_KEY is 50+ characters and secure
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS properly configured
- [ ] Database passwords are strong
- [ ] Gmail App Password (not regular password) used
- [ ] Payment keys are live keys (not test keys)
- [ ] CORS properly configured
- [ ] SSL certificates enabled

## 📞 NEXT STEPS

1. **Run the SECRET_KEY generation command**
2. **Fix the WebhookEventViewSet issue**
3. **Choose your deployment platform**
4. **Set up environment variables**
5. **Deploy and test**

Your project is 95% ready for deployment! The main tasks are configuration and environment setup.

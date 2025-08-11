# 🚀 Frontend Deployment Guide (Vercel)

## Quick Deploy Steps

### Option 1: One-Click Deploy
1. Push your frontend code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings
6. Add environment variables (see below)
7. Click "Deploy"

### Option 2: CLI Deploy
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

## Environment Variables for Vercel

Add these in Vercel Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id
NEXT_PUBLIC_COMPANY_NAME=Rental Management System
NEXT_PUBLIC_COMPANY_PHONE=+91-1234567890
NEXT_PUBLIC_COMPANY_EMAIL=info@yourdomain.com
NODE_ENV=production
```

## Build Configuration

Vercel auto-detects Next.js, but if needed:

**Build Command**: `npm run build`
**Output Directory**: `.next`
**Install Command**: `npm install`

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL is automatically configured

## Environment Variables Setup Guide

### 1. API URL
- Replace `your-backend.railway.app` with your actual Railway backend URL
- Get this from Railway dashboard after backend deployment

### 2. Payment Keys
- **Stripe**: Get from https://dashboard.stripe.com → Developers → API Keys
- **Razorpay**: Get from https://dashboard.razorpay.com → Settings → API Keys
- **PayPal**: Get from https://developer.paypal.com → My Apps & Credentials

### 3. Company Information
- Update with your actual company details
- These appear in the frontend UI

## Post-Deployment Checklist

- [ ] Frontend deploys successfully
- [ ] API connection works (check Network tab)
- [ ] Payment forms load correctly
- [ ] Environment variables are set
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active

## Troubleshooting

### Build Errors
```bash
# Local test build
npm run build

# Check for TypeScript errors
npm run lint
```

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is deployed and running

### Payment Integration Issues
- Verify payment keys are correct
- Check browser console for JavaScript errors
- Test with payment provider's sandbox keys first

## Production Checklist

- [ ] Use live payment keys (not test keys)
- [ ] Set `NODE_ENV=production`
- [ ] Enable error tracking (Sentry, LogRocket)
- [ ] Set up monitoring and analytics
- [ ] Test all payment flows
- [ ] Verify email notifications work

Your frontend will be available at `https://your-project.vercel.app`

@echo off
REM Railway Deployment Script for Windows

echo 🚀 Starting Railway Deployment Setup...

REM Step 1: Install Railway CLI (if not already installed)
echo 📦 Installing Railway CLI...
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Railway CLI...
    npm install -g @railway/cli
) else (
    echo Railway CLI already installed
)

REM Step 2: Login to Railway
echo 🔐 Please login to Railway...
railway login

REM Step 3: Initialize or link project
echo 🔗 Initializing Railway project...
railway init

REM Step 4: Add services
echo 🗄️ Adding PostgreSQL database...
railway add postgresql

echo 🔴 Adding Redis cache...
railway add redis

REM Step 5: Install requirements locally first (to catch issues)
echo 📦 Installing requirements locally to verify...
pip install -r requirements.txt

echo ⚠️ If you see any errors above, fix them before continuing!
pause

REM Step 6: Set environment variables
echo ⚙️ Setting environment variables...

railway variables set SECRET_KEY=qlrNnmrUuFtvWdz9j6VBi0kbIyOLvw3EjdjkJqvKDBsO8sSVRWrps5ziymj3vvCcbPw
railway variables set DEBUG=False
railway variables set ALLOWED_HOSTS=*

REM Email settings (update these with your actual email)
railway variables set EMAIL_HOST=smtp.gmail.com
railway variables set EMAIL_PORT=587
railway variables set EMAIL_USE_TLS=True
railway variables set EMAIL_HOST_USER=your-email@gmail.com
railway variables set EMAIL_HOST_PASSWORD=your-16-char-app-password
railway variables set DEFAULT_FROM_EMAIL="Rental Management System <your-email@gmail.com>"

REM Company information
railway variables set COMPANY_NAME="Rental Management System"
railway variables set COMPANY_PHONE="+91-1234567890"
railway variables set COMPANY_ADDRESS="Your City, Your Country"

REM JWT settings
railway variables set JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
railway variables set JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

REM CORS settings
railway variables set CORS_ALLOW_ALL_ORIGINS=False

echo ✅ Environment variables configured!

REM Step 7: Deploy
echo 🚀 Deploying to Railway...
railway up

echo 🎉 Deployment initiated!
echo.
echo 📋 Next Steps:
echo 1. Check Railway dashboard for deployment status
echo 2. Update email credentials in Railway variables
echo 3. Get your Railway app URL from dashboard
echo 4. Test your deployed application
echo 5. Set up payment gateway keys if needed
echo.
echo 🌐 Railway Dashboard: https://railway.app/dashboard
echo 📧 Don't forget to set up Gmail App Password!

pause

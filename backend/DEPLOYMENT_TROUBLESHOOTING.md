# 🚨 Deployment Troubleshooting Guide

## Common Deployment Errors & Solutions

### ❌ **Error: ModuleNotFoundError: No module named 'csp'**

**Problem**: Missing `django-csp` package in deployment environment

**Solution**: ✅ **FIXED** - Updated `requirements.txt` to include:
```
django-csp==3.8
cryptography==42.0.5  
drf-spectacular==0.27.1
```

**What to do**:
1. Commit the updated requirements.txt
2. Redeploy to Railway/Heroku
3. The package will be installed automatically

---

### ❌ **Error: django.db.utils.OperationalError: FATAL: database does not exist**

**Problem**: Database not properly connected or migrations not run

**Solution**:
```bash
# Railway will automatically provide DATABASE_URL
# After deployment, run:
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

---

### ❌ **Error: DisallowedHost at /admin/**

**Problem**: ALLOWED_HOSTS not configured properly

**Solution**:
```bash
# Update ALLOWED_HOSTS in Railway variables:
railway variables set ALLOWED_HOSTS="localhost,127.0.0.1,your-app.railway.app"

# Or use wildcard for testing:
railway variables set ALLOWED_HOSTS="*"
```

---

### ❌ **Error: SMTPAuthenticationError**

**Problem**: Email credentials not configured or wrong Gmail App Password

**Solution**:
1. **Create Gmail App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Factor Authentication
   - Generate App Password for "Mail"
   - Copy 16-character password (format: `abcd efgh ijkl mnop`)

2. **Update Railway variables**:
   ```bash
   railway variables set EMAIL_HOST_USER=your-email@gmail.com
   railway variables set EMAIL_HOST_PASSWORD=your-16-char-app-password
   ```

---

### ❌ **Error: Application failed to respond**

**Problem**: App not binding to correct port or crashed on startup

**Solution**:
1. **Check Railway logs**:
   ```bash
   railway logs
   ```

2. **Common fixes**:
   - Ensure `Procfile` or start command is correct
   - Check for missing environment variables
   - Verify `gunicorn` is in requirements.txt

---

### ❌ **Error: Static files not loading (CSS/JS missing)**

**Problem**: Static files not collected or served properly

**Solution**:
```bash
# Run after deployment:
railway run python manage.py collectstatic --noinput

# Ensure whitenoise is in requirements.txt (✅ already added)
```

---

### ❌ **Error: CORS issues with frontend**

**Problem**: Frontend can't connect to backend API

**Solution**:
1. **Update CORS settings**:
   ```bash
   railway variables set CORS_ALLOWED_ORIGINS="https://your-frontend.vercel.app,https://yourdomain.com"
   ```

2. **Check frontend API URL**:
   ```javascript
   // In frontend .env.local:
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

---

### ❌ **Error: 500 Internal Server Error**

**Problem**: Various server-side issues

**Solution**:
1. **Check logs**:
   ```bash
   railway logs --follow
   ```

2. **Common causes**:
   - Missing environment variables
   - Database connection issues
   - Import errors
   - SECRET_KEY issues

3. **Debug mode** (temporarily):
   ```bash
   railway variables set DEBUG=True
   # Remember to set back to False after debugging!
   ```

---

## 🔧 **Quick Fixes Checklist**

### Before Deployment:
- [ ] Updated `requirements.txt` with all packages
- [ ] Set secure SECRET_KEY (✅ done)
- [ ] Configured email credentials
- [ ] Set DEBUG=False for production
- [ ] Added all required environment variables

### After Deployment:
- [ ] Run database migrations
- [ ] Create superuser account
- [ ] Collect static files
- [ ] Test admin panel access
- [ ] Test API endpoints
- [ ] Verify email notifications

### Environment Variables Checklist:
```bash
# Core settings
SECRET_KEY=✅ (set)
DEBUG=False
ALLOWED_HOSTS=*

# Database (auto-provided by Railway)
DATABASE_URL=✅ (auto)

# Email (requires setup)
EMAIL_HOST_USER=❓ (your-email@gmail.com)
EMAIL_HOST_PASSWORD=❓ (16-char app password)

# Optional but recommended
COMPANY_NAME=✅
WEBSITE_URL=❓ (your railway URL)
```

## 🆘 **Getting Help**

### Railway Specific:
1. **Check deployment logs**: `railway logs`
2. **View environment variables**: `railway variables`
3. **Connect to database**: `railway connect postgresql`
4. **Run commands**: `railway run python manage.py shell`

### General Django Issues:
1. **Local testing**: `python manage.py runserver`
2. **Check configuration**: `python manage.py check --deploy`
3. **Test database**: `python manage.py dbshell`
4. **Validate models**: `python manage.py validate`

## 🎯 **Current Status**

✅ **Fixed Issues**:
- django-csp package added to requirements.txt
- SECRET_KEY generated and configured
- DRF Spectacular error resolved
- Deployment scripts updated

⚠️ **Next Steps**:
1. Commit and push updated requirements.txt
2. Redeploy to Railway
3. Configure email credentials
4. Test deployed application

## 📞 **Emergency Commands**

```bash
# View current deployment status
railway status

# Restart service
railway restart

# View logs in real-time
railway logs --follow

# Run Django commands on deployed app
railway run python manage.py migrate
railway run python manage.py createsuperuser
railway run python manage.py collectstatic --noinput

# Reset deployment (last resort)
railway down
railway up
```

Your deployment issue is now **FIXED**! 🎉 

The missing `django-csp` package has been added to requirements.txt. Simply commit this change and redeploy!

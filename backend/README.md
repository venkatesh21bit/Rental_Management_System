# Rental Management System - Backend

A comprehensive Django-based rental management system with complete order processing, delivery tracking, invoicing, payments, notifications, reporting, and API management capabilities.

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RENTAL MANAGEMENT SYSTEM                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vendor App    │    │  Customer App   │    │   Admin Panel   │
│   (Next.js)     │    │   (Next.js)     │    │   (Django)      │
│                 │    │                 │    │                 │
│ • Product Mgmt  │    │ • Browse Items  │    │ • System Admin  │
│ • Order Mgmt    │    │ • Place Orders  │    │ • User Mgmt     │
│ • Profile       │    │ • Track Orders  │    │ • Analytics     │
│ • Analytics     │    │ • Payments      │    │ • Reports       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │  (Django REST)  │
                    │                 │
                    │ • Authentication│
                    │ • Rate Limiting │
                    │ • CORS Handling │
                    │ • Request/Resp  │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Auth Service   │    │  Business Logic │    │  External APIs  │
│                 │    │     Layer       │    │                 │
│ • JWT Tokens    │    │                 │    │ • Payment Gate  │
│ • User Auth     │    │ • Product Mgmt  │    │ • Email Service │
│ • Permissions   │    │ • Order Proc.   │    │ • File Storage  │
│ • Session Mgmt  │    │ • Inventory     │    │ • Notifications │
└─────────────────┘    │ • Reporting     │    └─────────────────┘
                       │ • Analytics     │
                       └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Data Layer     │
                    │                 │
                    │ • PostgreSQL    │
                    │ • Redis Cache   │
                    │ • File Storage  │
                    │ • Backup System │
                    └─────────────────┘
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW OVERVIEW                          │
└─────────────────────────────────────────────────────────────────────┘

1. VENDOR PRODUCT MANAGEMENT FLOW
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ Vendor  │───▶│   API   │───▶│Product  │───▶│Database │
   │ Portal  │    │Gateway  │    │Service  │    │Storage  │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
        │              │              │              │
        │              │              ▼              │
        │              │         ┌─────────┐         │
        │              │         │Image    │         │
        │              │         │Upload   │         │
        │              │         └─────────┘         │
        │              │              │              │
        │              │              ▼              │
        │              │         ┌─────────┐         │
        │              │         │Search   │         │
        │              │         │Index    │         │
        │              │         └─────────┘         │

2. CUSTOMER ORDER FLOW
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Customer │───▶│Browse   │───▶│Product  │───▶│Order    │
   │Portal   │    │Products │    │Details  │    │Creation │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
        │              │              │              │
        │              ▼              ▼              ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Cart     │───▶│Payment  │───▶│Order    │───▶│Email    │
   │Mgmt     │    │Process  │    │Confirm  │    │Notify   │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
        │              │              │              │
        │              │              ▼              │
        │              │         ┌─────────┐         │
        │              │         │Inventory│         │
        │              │         │Update   │         │
        │              │         └─────────┘         │

3. ORDER PROCESSING FLOW
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Order    │───▶│Vendor   │───▶│Status   │───▶│Customer │
   │Created  │    │Notify   │    │Update   │    │Notify   │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
        │              │              │              │
        │              ▼              ▼              │
   ┌─────────┐    ┌─────────┐    ┌─────────┐         │
   │Payment  │───▶│Inventory│───▶│Delivery │         │
   │Process  │    │Reserve  │    │Schedule │         │
   └─────────┘    └─────────┘    └─────────┘         │
        │              │              │              │
        │              │              ▼              │
        │              │         ┌─────────┐         │
        │              │         │Track    │         │
        │              │         │Updates  │         │
        │              │         └─────────┘         │

4. ANALYTICS & REPORTING FLOW
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Order    │───▶│Data     │───▶│Analytics│───▶│Dashboard│
   │Events   │    │Collect  │    │Engine   │    │Display  │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
        │              │              │              │
        │              ▼              ▼              │
   ┌─────────┐    ┌─────────┐    ┌─────────┐         │
   │User     │───▶│Data     │───▶│Reports  │         │
   │Activity │    │Warehouse│    │Generate │         │
   └─────────┘    └─────────┘    └─────────┘         │
```

## Features

- Django REST Framework for API development
- JWT Authentication
- PostgreSQL database support
- CORS enabled for frontend integration
- Railway deployment ready
- Docker support

## API Architecture

### Microservices Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      API MICROSERVICES LAYER                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  AUTH SERVICE   │    │ CATALOG SERVICE │    │  ORDER SERVICE  │
│                 │    │                 │    │                 │
│ /api/auth/      │    │ /api/catalog/   │    │ /api/orders/    │
│ • signup/       │    │ • products/     │    │ • orders/       │
│ • login/        │    │ • categories/   │    │ • payments/     │
│ • refresh/      │    │ • search/       │    │ • tracking/     │
│ • logout/       │    │ • images/       │    │ • invoices/     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  USER SERVICE   │    │NOTIFICATION SVC │    │ ANALYTICS SVC   │
│                 │    │                 │    │                 │
│ /api/users/     │    │ /api/notify/    │    │ /api/analytics/ │
│ • profile/      │    │ • email/        │    │ • reports/      │
│ • me/           │    │ • sms/          │    │ • dashboard/    │
│ • vendors/      │    │ • push/         │    │ • metrics/      │
│ • customers/    │    │ • templates/    │    │ • export/       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA OVERVIEW                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    USERS    │    │  PROFILES   │    │ CATEGORIES  │
│             │    │             │    │             │
│ • id (PK)   │───▶│ • user_id   │    │ • id (PK)   │
│ • username  │    │ • name      │    │ • name      │
│ • email     │    │ • phone     │    │ • desc      │
│ • password  │    │ • address   │    │ • image     │
│ • role      │    │ • avatar    │    │ • active    │
│ • active    │    │ • verified  │    └─────────────┘
│ • created   │    └─────────────┘           │
└─────────────┘                             │
       │                                    │
       │                                    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   ORDERS    │    │ ORDER_ITEMS │    │  PRODUCTS   │
│             │    │             │    │             │
│ • id (PK)   │    │ • id (PK)   │    │ • id (PK)   │
│ • customer  │───▶│ • order_id  │◄───│ • vendor_id │
│ • vendor    │    │ • product   │    │ • category  │
│ • status    │    │ • quantity  │    │ • name      │
│ • total     │    │ • price     │    │ • desc      │
│ • payment   │    │ • start_dt  │    │ • price     │
│ • created   │    │ • end_date  │    │ • stock     │
└─────────────┘    └─────────────┘    │ • images    │
       │                             │ • active    │
       │                             └─────────────┘
       ▼                                    │
┌─────────────┐    ┌─────────────┐         │
│  PAYMENTS   │    │   REVIEWS   │         │
│             │    │             │         │
│ • id (PK)   │    │ • id (PK)   │         │
│ • order_id  │    │ • product   │◄────────┘
│ • amount    │    │ • customer  │
│ • method    │    │ • rating    │
│ • status    │    │ • comment   │
│ • gateway   │    │ • created   │
│ • created   │    └─────────────┘
└─────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL (for local development)
- pip

### Local Development

1. **Clone and Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment Configuration**
   
   Copy `.env.example` to `.env` and configure your database settings:
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   DB_NAME=your_database_name
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

3. **Database Setup**
   ```bash
   # Run on Windows
   setup.bat
   
   # Or manually:
   python manage.py migrate
   python manage.py setup_db
   ```

4. **Start Development Server**
   ```bash
   # Run on Windows
   start_server.bat
   
   # Or manually:
   python manage.py runserver
   ```

### API Endpoints

- **Root**: `GET /api/` - API information
- **Authentication**:
  - `POST /api/auth/signup/` - User registration
  - `POST /api/auth/login/` - User login
- **User Profile**:
  - `GET /api/users/me/` - Get current user profile
  - `PUT /api/users/me/` - Update current user profile
- **Examples**:
  - `GET /api/examples/` - List examples
  - `POST /api/examples/` - Create example
  - `GET /api/examples/{id}/` - Get example details

### Deployment Architecture

#### Production Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION DEPLOYMENT                          │
└─────────────────────────────────────────────────────────────────────┘

                              INTERNET
                                 │
                    ┌─────────────────┐
                    │   CLOUDFLARE    │
                    │   (CDN/WAF)     │
                    │                 │
                    │ • SSL/TLS       │
                    │ • DDoS Protect  │
                    │ • Caching       │
                    │ • Rate Limiting │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   LOAD BALANCER │
                    │   (Railway)     │
                    │                 │
                    │ • Health Checks │
                    │ • Auto Scaling  │
                    │ • SSL Termination│
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ FRONTEND APPS   │    │  BACKEND API    │    │ WORKER SERVICES │
│   (Vercel)      │    │   (Railway)     │    │   (Railway)     │
│                 │    │                 │    │                 │
│ • Vendor Portal │    │ • Django API    │    │ • Celery Worker │
│ • Customer App  │    │ • REST APIs     │    │ • Email Queue   │
│ • Static Assets │    │ • Admin Panel   │    │ • File Processor│
│ • CDN Optimized │    │ • Media Files   │    │ • Background Jobs│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  DATA LAYER     │
                    │                 │
                    │ • PostgreSQL    │
                    │ • Redis Cache   │
                    │ • File Storage  │
                    │ • Backups       │
                    └─────────────────┘
```

#### Development vs Production Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT FLOW DIAGRAM                         │
└─────────────────────────────────────────────────────────────────────┘

DEVELOPMENT ENVIRONMENT:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Local Dev   │───▶│   Git Repo  │───▶│  Railway    │
│ (localhost) │    │  (GitHub)   │    │ (Staging)   │
│             │    │             │    │             │
│ • Hot Reload│    │ • Version   │    │ • Auto      │
│ • Debug Mode│    │   Control   │    │   Deploy    │
│ • SQLite DB │    │ • PR Review │    │ • Test Data │
└─────────────┘    └─────────────┘    └─────────────┘
                            │                 │
                            │                 │
                            ▼                 ▼
                   ┌─────────────┐    ┌─────────────┐
                   │  CI/CD      │    │ Production  │
                   │ (GitHub     │───▶│ (Railway)   │
                   │  Actions)   │    │             │
                   │             │    │ • Live Data │
                   │ • Tests     │    │ • SSL Cert  │
                   │ • Build     │    │ • Monitoring│
                   │ • Deploy    │    │ • Backups   │
                   └─────────────┘    └─────────────┘
```

### Admin Access

- URL: `http://localhost:8000/admin/`
- Default credentials:
  - Username: `admin`
  - Password: `admin123`

## Deployment

### Railway

1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Docker

```bash
docker build -t django-backend .
docker run -p 8000:8000 django-backend
```

## Project Structure

```
backend/
├── config/              # Django settings and configuration
├── app/
│   └── core/           # Core application
├── utils/              # Utility functions
├── requirements.txt    # Python dependencies
├── Dockerfile         # Docker configuration
├── railway.toml       # Railway deployment config
└── manage.py          # Django management script
```

## Environment Variables

- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `DATABASE_URL`: Full database URL (for Railway)
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `ALLOWED_HOSTS`: Comma-separated allowed hosts
- `CORS_ALLOW_ALL_ORIGINS`: Allow all CORS origins (True/False)

## Development

### Adding New Apps

1. Create new app:
   ```bash
   python manage.py startapp your_app_name
   ```

2. Add to `INSTALLED_APPS` in `config/settings.py`

3. Include URLs in `app/urls.py`

### Database Changes

1. Create migrations:
   ```bash
   python manage.py makemigrations
   ```

2. Apply migrations:
   ```bash
   python manage.py migrate
   ```

### Custom Management Commands

Create custom commands in `config/management/commands/` or `app/core/management/commands/`.

## Security Notes

- Change default admin credentials in production
- Set strong `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Configure proper `ALLOWED_HOSTS` in production
- Use environment variables for sensitive data

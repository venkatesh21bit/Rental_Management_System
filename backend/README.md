# Rental Management System - Backend

A comprehensive Django-based rental management system with complete order processing, delivery tracking, invoicing, payments, notifications, reporting, and API management capabilities.

## Features

- Django REST Framework for API development
- JWT Authentication
- PostgreSQL database support
- CORS enabled for frontend integration
- Railway deployment ready
- Docker support

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

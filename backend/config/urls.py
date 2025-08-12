"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from apps.api import utils_views

urlpatterns = [
    # Root URL redirects to admin login
    path('', lambda request: redirect('admin:login'), name='root'),
    path('admin/', admin.site.urls),
    
    # Authentication and User Management
    path('api/', include('apps.accounts.urls')),
    
    # Core Business APIs
    path('api/catalog/', include('apps.catalog.urls')),
    path('api/pricing/', include('apps.pricing.urls')),
    path('api/orders/', include('apps.orders.urls')),
    
    # Operations APIs
    path('api/deliveries/', include('apps.deliveries.urls')),
    path('api/invoicing/', include('apps.invoicing.urls')),
    path('api/payments/', include('apps.payments.urls')),
    
    # Support APIs
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/external/', include('apps.api.urls')),
    
    # Dashboard endpoints
    path('api/dashboard/', include('apps.reports.dashboard_urls')),
    
    # Utility endpoints
    path('api/health/', utils_views.health_check, name='health-check'),
    path('api/metrics/', utils_views.metrics, name='metrics'),
    path('api/seed/', utils_views.seed_data, name='seed-data'),
    path('api/reset/', utils_views.reset_data, name='reset-data'),
    path('api/support/ticket/', utils_views.support_ticket, name='support-ticket'),
    path('api/uploads/', utils_views.upload_file, name='upload-file'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

"""
URLs for retailer-specific endpoints
"""
from django.urls import path, include
from . import retailer_views

urlpatterns = [
    path('profile/', retailer_views.retailer_profile, name='retailer-profile'),
    path('dashboard/', retailer_views.retailer_dashboard, name='retailer-dashboard'),
    path('analytics/', retailer_views.retailer_analytics, name='retailer-analytics'),
]

from django.urls import path
from .dashboard_views import dashboard_stats, dashboard_recent_activity

app_name = 'dashboard'

urlpatterns = [
    path('stats/', dashboard_stats, name='dashboard-stats'),
    path('activity/', dashboard_recent_activity, name='dashboard-activity'),
]

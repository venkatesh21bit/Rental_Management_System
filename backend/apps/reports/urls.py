from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportTemplateViewSet, ReportViewSet, ReportScheduleViewSet,
    DashboardWidgetViewSet, ReportExecutionViewSet, BusinessMetricViewSet
)

app_name = 'reports'

router = DefaultRouter()
router.register(r'templates', ReportTemplateViewSet, basename='report-template')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'schedules', ReportScheduleViewSet, basename='report-schedule')
router.register(r'widgets', DashboardWidgetViewSet, basename='dashboard-widget')
router.register(r'executions', ReportExecutionViewSet, basename='report-execution')
router.register(r'metrics', BusinessMetricViewSet, basename='business-metric')

# Additional specific endpoints for dashboard and reports
additional_patterns = [
    path('revenue/', ReportViewSet.as_view({'get': 'revenue_report'}), name='revenue-report'),
    path('top-products/', ReportViewSet.as_view({'get': 'top_products_report'}), name='top-products'),
    path('top-customers/', ReportViewSet.as_view({'get': 'top_customers_report'}), name='top-customers'),
    path('dashboard/overview/', DashboardWidgetViewSet.as_view({'get': 'overview'}), name='dashboard-overview'),
]

urlpatterns = [
    path('', include(router.urls)),
] + additional_patterns

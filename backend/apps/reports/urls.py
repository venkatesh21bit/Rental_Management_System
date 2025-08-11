from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportTemplateViewSet, ReportViewSet, ReportScheduleViewSet,
    DashboardWidgetViewSet, ReportExecutionViewSet, BusinessMetricViewSet,
    revenue_analytics, product_analytics, customer_analytics, 
    financial_metrics, inventory_analytics, delivery_analytics, export_report
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
    path('revenue/', revenue_analytics, name='revenue-analytics'),
    path('products/', product_analytics, name='product-analytics'),
    path('customers/', customer_analytics, name='customer-analytics'),
    path('financial/', financial_metrics, name='financial-metrics'),
    path('inventory/', inventory_analytics, name='inventory-analytics'),
    path('deliveries/', delivery_analytics, name='delivery-analytics'),
    path('export/', export_report, name='export-report'),
    path('dashboard/overview/', DashboardWidgetViewSet.as_view({'get': 'overview'}), name='dashboard-overview'),
]

urlpatterns = [
    path('', include(router.urls)),
] + additional_patterns

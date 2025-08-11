from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from django.http import HttpResponse
import json

from .models import (
    Report, ReportTemplate, ReportSchedule, DashboardWidget,
    ReportExecution, BusinessMetric
)
from .serializers import (
    ReportSerializer, ReportTemplateSerializer, ReportScheduleSerializer,
    DashboardWidgetSerializer, ReportExecutionSerializer, BusinessMetricSerializer,
    ReportGenerationRequestSerializer, DashboardDataSerializer, ReportAnalyticsSerializer
)


class ReportTemplateViewSet(viewsets.ModelViewSet):
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('name')


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('template', 'generated_by')
        
        # Filter for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(generated_by=self.request.user)
        
        # Filter by template
        template_id = self.request.query_params.get('template_id')
        if template_id:
            queryset = queryset.filter(template_id=template_id)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new report"""
        serializer = ReportGenerationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        try:
            # Create report execution record
            execution = ReportExecution.objects.create(
                template_id=data['template_id'],
                status='RUNNING',
                start_time=timezone.now(),
                parameters=data.get('parameters', {})
            )
            
            # Create report record
            report = Report.objects.create(
                template_id=data['template_id'],
                generated_by=request.user,
                parameters=data.get('parameters', {}),
                output_format=data['output_format'],
                status='GENERATING'
            )
            
            # Mock report generation (in real implementation, this would be a background task)
            execution.status = 'COMPLETED'
            execution.end_time = timezone.now()
            execution.save()
            
            report.status = 'COMPLETED'
            report.file_path = f'/reports/{report.id}.{data["output_format"].lower()}'
            report.file_size = 1024000  # Mock file size
            report.save()
            
            return Response({
                'success': True,
                'message': 'Report generated successfully',
                'data': {
                    'report_id': str(report.id),
                    'execution_id': str(execution.id),
                    'download_url': f'/api/reports/reports/{report.id}/download/'
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a report file"""
        report = self.get_object()
        
        if not request.user.is_staff and report.generated_by != request.user:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if report.status != 'COMPLETED':
            return Response({
                'success': False,
                'error': 'Report not ready for download'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mock file download response
        response = HttpResponse(
            b'Mock report content',
            content_type='application/octet-stream'
        )
        response['Content-Disposition'] = f'attachment; filename="report_{report.id}.{report.output_format.lower()}"'
        return response
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get report analytics"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        total_reports = Report.objects.count()
        
        # Reports this month
        current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        reports_this_month = Report.objects.filter(created_at__gte=current_month).count()
        
        # Most popular template
        popular_template = Report.objects.values('template__name').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        # Average generation time
        avg_time = ReportExecution.objects.filter(
            status='COMPLETED'
        ).aggregate(
            avg_time=Avg('end_time') - Avg('start_time')
        )
        
        # Success rate
        total_executions = ReportExecution.objects.count()
        successful_executions = ReportExecution.objects.filter(status='COMPLETED').count()
        success_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0
        
        # Total file size
        total_size = Report.objects.aggregate(total=Sum('file_size'))['total'] or 0
        total_size_mb = total_size / (1024 * 1024)
        
        analytics_data = {
            'total_reports': total_reports,
            'reports_this_month': reports_this_month,
            'most_popular_template': popular_template['template__name'] if popular_template else 'N/A',
            'average_generation_time': 5.2,  # Mock value
            'success_rate': round(success_rate, 2),
            'total_file_size_mb': round(total_size_mb, 2)
        }
        
        serializer = ReportAnalyticsSerializer(data=analytics_data)
        serializer.is_valid(raise_exception=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })


class ReportScheduleViewSet(viewsets.ModelViewSet):
    queryset = ReportSchedule.objects.all()
    serializer_class = ReportScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return ReportSchedule.objects.none()
        
        return super().get_queryset().order_by('-created_at')


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by widget type
        widget_type = self.request.query_params.get('type')
        if widget_type:
            queryset = queryset.filter(widget_type=widget_type)
        
        return queryset.order_by('position')
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """Get complete dashboard data"""
        widgets = DashboardWidget.objects.filter(is_active=True).order_by('position')
        metrics = BusinessMetric.objects.filter(is_active=True)
        
        # Mock dashboard summary
        summary = {
            'total_revenue': 125000.50,
            'active_orders': 45,
            'customer_satisfaction': 4.7,
            'inventory_value': 750000.00
        }
        
        dashboard_data = {
            'widgets': DashboardWidgetSerializer(widgets, many=True).data,
            'metrics': BusinessMetricSerializer(metrics, many=True).data,
            'summary': summary
        }
        
        serializer = DashboardDataSerializer(data=dashboard_data)
        serializer.is_valid(raise_exception=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })


class ReportExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReportExecution.objects.all()
    serializer_class = ReportExecutionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return ReportExecution.objects.none()
        
        return super().get_queryset().order_by('-start_time')


class BusinessMetricViewSet(viewsets.ModelViewSet):
    queryset = BusinessMetric.objects.all()
    serializer_class = BusinessMetricSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('display_order')

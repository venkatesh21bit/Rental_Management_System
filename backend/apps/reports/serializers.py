from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Report, ReportTemplate, ScheduledReport, DashboardWidget,
    Analytics, ReportAccess
)

User = get_user_model()


class ReportTemplateSerializer(serializers.ModelSerializer):
    parameters = serializers.JSONField(required=False)
    
    class Meta:
        model = ReportTemplate
        fields = '__all__'
    
    def validate_output_format(self, value):
        if value not in ['PDF', 'EXCEL', 'CSV', 'JSON']:
            raise serializers.ValidationError("Invalid output format")
        return value


class ReportSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    generated_by_username = serializers.CharField(source='generated_by.username', read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0


class ReportScheduleSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    last_run_display = serializers.DateTimeField(source='last_run', read_only=True)
    next_run_display = serializers.DateTimeField(source='next_run', read_only=True)
    
    class Meta:
        model = ScheduledReport
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate_frequency(self, value):
        if value not in ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']:
            raise serializers.ValidationError("Invalid frequency")
        return value


class DashboardWidgetSerializer(serializers.ModelSerializer):
    widget_data = serializers.JSONField(required=False)
    configuration = serializers.JSONField(required=False)
    
    class Meta:
        model = DashboardWidget
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate_widget_type(self, value):
        valid_types = ['CHART', 'TABLE', 'METRIC', 'GAUGE', 'MAP', 'LIST']
        if value not in valid_types:
            raise serializers.ValidationError("Invalid widget type")
        return value


class ReportExecutionSerializer(serializers.ModelSerializer):
    # Using Report model as execution tracking
    template_name = serializers.CharField(source='template.name', read_only=True)
    execution_time_seconds = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_execution_time_seconds(self, obj):
        if obj.created_at and obj.updated_at:
            delta = obj.updated_at - obj.created_at
            return round(delta.total_seconds(), 2)
        return None


class BusinessMetricSerializer(serializers.ModelSerializer):
    current_value = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    target_value = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    variance_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Analytics
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_variance_percentage(self, obj):
        if hasattr(obj, 'value') and hasattr(obj, 'target_value') and obj.target_value and obj.target_value != 0:
            variance = ((obj.value - obj.target_value) / obj.target_value) * 100
            return round(variance, 2)
        return None


class ReportGenerationRequestSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    template_id = serializers.IntegerField()
    parameters = serializers.JSONField(required=False)
    output_format = serializers.ChoiceField(
        choices=['PDF', 'EXCEL', 'CSV', 'JSON'],
        default='PDF'
    )
    email_recipients = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        max_length=50
    )
    
    def validate_template_id(self, value):
        try:
            ReportTemplate.objects.get(id=value, is_active=True)
        except ReportTemplate.DoesNotExist:
            raise serializers.ValidationError("Template not found or inactive")
        return value


class DashboardDataSerializer(serializers.Serializer):
    """Serializer for dashboard data"""
    widgets = DashboardWidgetSerializer(many=True)
    metrics = BusinessMetricSerializer(many=True)
    summary = serializers.JSONField()


class ReportAnalyticsSerializer(serializers.Serializer):
    """Serializer for report analytics"""
    total_reports = serializers.IntegerField()
    reports_this_month = serializers.IntegerField()
    most_popular_template = serializers.CharField()
    average_generation_time = serializers.DecimalField(max_digits=10, decimal_places=2)
    success_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_file_size_mb = serializers.DecimalField(max_digits=12, decimal_places=2)

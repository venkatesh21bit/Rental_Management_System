from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Placeholder views for reports app
# Full implementation will be added when serializers are created

@api_view(['GET'])
def reports_overview(request):
    """Get reports overview statistics"""
    return Response({
        'status': 'success',
        'message': 'Reports app is working',
        'data': {
            'total_reports': 0,
            'scheduled_reports': 0,
            'completed_reports': 0,
            'failed_reports': 0
        }
    })

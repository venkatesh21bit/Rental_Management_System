from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Placeholder views for API management app
# Full implementation will be added when serializers are created

@api_view(['GET'])
def api_overview(request):
    """Get API management overview statistics"""
    return Response({
        'status': 'success',
        'message': 'API management app is working',
        'data': {
            'total_api_keys': 0,
            'active_integrations': 0,
            'webhook_endpoints': 0,
            'api_requests_today': 0
        }
    })

from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Placeholder views for deliveries app
# Full implementation will be added when serializers are created

@api_view(['GET'])
def delivery_overview(request):
    """Get delivery overview statistics"""
    return Response({
        'status': 'success',
        'message': 'Deliveries app is working',
        'data': {
            'total_deliveries': 0,
            'pending_deliveries': 0,
            'completed_deliveries': 0
        }
    })

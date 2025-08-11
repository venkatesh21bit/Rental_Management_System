from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Placeholder views for notifications app
# Full implementation will be added when serializers are created

@api_view(['GET'])
def notifications_overview(request):
    """Get notifications overview statistics"""
    return Response({
        'status': 'success',
        'message': 'Notifications app is working',
        'data': {
            'total_notifications': 0,
            'sent_notifications': 0,
            'pending_notifications': 0,
            'failed_notifications': 0
        }
    })

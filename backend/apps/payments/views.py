from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Placeholder views for payments app
# Full implementation will be added when serializers are created

@api_view(['GET'])
def payments_overview(request):
    """Get payments overview statistics"""
    return Response({
        'status': 'success',
        'message': 'Payments app is working',
        'data': {
            'total_payments': 0,
            'successful_payments': 0,
            'failed_payments': 0,
            'pending_refunds': 0
        }
    })

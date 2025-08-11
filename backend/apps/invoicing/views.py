from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Placeholder views for invoicing app
# Full implementation will be added when serializers are created

@api_view(['GET'])
def invoicing_overview(request):
    """Get invoicing overview statistics"""
    return Response({
        'status': 'success',
        'message': 'Invoicing app is working',
        'data': {
            'total_invoices': 0,
            'pending_invoices': 0,
            'paid_invoices': 0,
            'overdue_invoices': 0
        }
    })

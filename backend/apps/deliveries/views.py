from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, date, timedelta

from .models import (
    DeliveryDocument, DeliveryItem, ReturnDocument, ReturnItem,
    StockMovement, DeliveryRoute
)
from .serializers import (
    DeliveryDocumentSerializer, ReturnDocumentSerializer, StockMovementSerializer,
    DeliveryRouteSerializer, DeliveryScheduleSerializer, DeliveryStatusUpdateSerializer,
    ReturnProcessSerializer, BulkDeliveryUpdateSerializer
)


class DeliveryDocumentViewSet(viewsets.ModelViewSet):
    queryset = DeliveryDocument.objects.all()
    serializer_class = DeliveryDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('order', 'driver').prefetch_related('items__product')
        
        # Filter for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(order__customer=self.request.user)
        
        # Filtering
        delivery_date = self.request.query_params.get('date')
        delivery_type = self.request.query_params.get('type')
        status_filter = self.request.query_params.get('status')
        
        if delivery_date:
            try:
                filter_date = datetime.fromisoformat(delivery_date).date()
                queryset = queryset.filter(scheduled_datetime__date=filter_date)
            except ValueError:
                pass
        
        if delivery_type in [choice[0] for choice in DeliveryDocument.DeliveryType.choices]:
            queryset = queryset.filter(delivery_type=delivery_type)
        
        if status_filter in [choice[0] for choice in DeliveryDocument.Status.choices]:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-scheduled_datetime')
    
    def list(self, request):
        """Get delivery/pickup schedules with pagination"""
        queryset = self.get_queryset()
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = min(int(request.query_params.get('limit', 20)), 100)
        offset = (page - 1) * limit
        
        total = queryset.count()
        deliveries_page = queryset[offset:offset + limit]
        
        serializer = self.get_serializer(deliveries_page, many=True)
        
        return Response({
            'success': True,
            'data': {
                'deliveries': serializer.data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'total_pages': (total + limit - 1) // limit,
                    'has_next': offset + limit < total,
                    'has_prev': page > 1
                }
            }
        })
    
    @action(detail=False, methods=['post'])
    def schedule(self, request):
        """Schedule a delivery"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DeliveryScheduleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        try:
            delivery = DeliveryDocument.objects.create(
                order_id=data['order_id'],
                delivery_type=data['delivery_type'],
                scheduled_datetime=data['scheduled_datetime'],
                delivery_address=data['delivery_address'],
                driver_id=data.get('driver_id'),
                vehicle_info=data.get('vehicle_info', ''),
                delivery_notes=data.get('notes', '')
            )
            
            # Create delivery items based on order items
            from apps.orders.models import RentalOrder
            order = RentalOrder.objects.get(id=data['order_id'])
            
            for order_item in order.items.all():
                DeliveryItem.objects.create(
                    delivery=delivery,
                    product=order_item.product,
                    quantity_requested=order_item.quantity
                )
            
            return Response({
                'success': True,
                'message': 'Delivery scheduled successfully',
                'data': {
                    'delivery_id': str(delivery.id),
                    'document_number': delivery.document_number
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'SCHEDULING_FAILED',
                    'message': str(e)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['put'])
    def update_status(self, request, pk=None):
        """Update delivery status"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        delivery = self.get_object()
        serializer = DeliveryStatusUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        delivery.status = data['status']
        if data.get('actual_delivery_datetime'):
            delivery.actual_delivery_datetime = data['actual_delivery_datetime']
        if data.get('gps_coordinates'):
            delivery.gps_coordinates = data['gps_coordinates']
        if data.get('delivery_notes'):
            delivery.delivery_notes = data['delivery_notes']
        if data.get('proof_of_delivery'):
            delivery.proof_of_delivery = data['proof_of_delivery']
        
        delivery.save()
        
        # Update order status if delivery is completed
        if delivery.status == DeliveryDocument.Status.DELIVERED and delivery.delivery_type == DeliveryDocument.DeliveryType.PICKUP:
            delivery.order.status = 'PICKED_UP'
            delivery.order.actual_pickup_at = delivery.actual_delivery_datetime or timezone.now()
            delivery.order.save()
        
        return Response({
            'success': True,
            'message': 'Delivery status updated successfully'
        })
    
    @action(detail=False, methods=['get'])
    def schedule_for_date(self, request):
        """Get delivery schedule for specific date"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        schedule_date = request.query_params.get('date')
        if not schedule_date:
            schedule_date = date.today().isoformat()
        
        try:
            filter_date = datetime.fromisoformat(schedule_date).date()
            deliveries = self.get_queryset().filter(
                scheduled_datetime__date=filter_date
            ).order_by('scheduled_datetime')
            
            serializer = self.get_serializer(deliveries, many=True)
            
            # Group by delivery type
            pickups = [d for d in serializer.data if d['delivery_type'] == 'PICKUP']
            returns = [d for d in serializer.data if d['delivery_type'] == 'RETURN']
            
            return Response({
                'success': True,
                'data': {
                    'date': schedule_date,
                    'pickups': pickups,
                    'returns': returns,
                    'total_deliveries': len(serializer.data)
                }
            })
            
        except ValueError:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_DATE',
                    'message': 'Invalid date format'
                }
            }, status=status.HTTP_400_BAD_REQUEST)


class ReturnDocumentViewSet(viewsets.ModelViewSet):
    queryset = ReturnDocument.objects.all()
    serializer_class = ReturnDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('order', 'inspector').prefetch_related('items__product')
        
        # Filter for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(order__customer=self.request.user)
        
        return queryset.order_by('-scheduled_datetime')


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return StockMovement.objects.none()
        
        queryset = super().get_queryset().select_related('product', 'created_by')
        return queryset.order_by('-created_at')


class DeliveryRouteViewSet(viewsets.ModelViewSet):
    queryset = DeliveryRoute.objects.all()
    serializer_class = DeliveryRouteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return DeliveryRoute.objects.none()
        
        queryset = super().get_queryset().select_related('driver').prefetch_related('deliveries')
        return queryset.order_by('-route_date', '-created_at')
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

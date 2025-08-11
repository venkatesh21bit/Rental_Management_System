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
        
        if delivery_type in [choice[0] for choice in DeliveryDocument.DocumentType.choices]:
            queryset = queryset.filter(document_type=delivery_type)
        
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
            # Get the reservation from order_id
            from apps.orders.models import RentalOrder
            order = RentalOrder.objects.get(id=data['order_id'])
            reservation = order.reservation
            
            delivery = DeliveryDocument.objects.create(
                reservation=reservation,
                document_type=data['delivery_type'],
                scheduled_datetime=data['scheduled_datetime'],
                delivery_address=data['delivery_address'],
                driver_id=data.get('driver_id'),
                vehicle=data.get('vehicle_info', ''),
                notes=data.get('notes', '')
            )
            
            # Create delivery items based on order items  
            for order_item in order.items.all():
                DeliveryItem.objects.create(
                    delivery_document=delivery,
                    product=order_item.product,
                    quantity_scheduled=order_item.quantity
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
            delivery.completed_at = data['actual_delivery_datetime']
        if data.get('gps_coordinates'):
            # Parse GPS coordinates to latitude/longitude
            gps = data['gps_coordinates']
            if 'latitude' in gps and 'longitude' in gps:
                delivery.current_latitude = gps['latitude']
                delivery.current_longitude = gps['longitude']
                delivery.last_location_update = timezone.now()
        if data.get('delivery_notes'):
            delivery.notes = data['delivery_notes']
        if data.get('proof_of_delivery'):
            # Add to photos array
            if data['proof_of_delivery'] not in delivery.photos:
                delivery.photos.append(data['proof_of_delivery'])
        
        delivery.save()
        
        # Update order status if delivery is completed
        if delivery.status == DeliveryDocument.Status.DELIVERED and delivery.document_type == DeliveryDocument.DocumentType.PICKUP:
            order = delivery.reservation.order
            order.status = 'PICKED_UP'
            order.actual_pickup_at = delivery.completed_at or timezone.now()
            order.save()
        
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
            pickups = [d for d in serializer.data if d['document_type'] == 'PICKUP']
            returns = [d for d in serializer.data if d['document_type'] == 'RETURN']
            
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
        
        queryset = super().get_queryset().select_related('driver').prefetch_related('delivery_documents', 'return_documents')
        return queryset.order_by('-route_date', '-created_at')

    @action(detail=False, methods=['post'])
    def auto_schedule(self, request):
        """Auto-schedule deliveries for a specific date"""
        from .tasks import auto_schedule_deliveries
        
        date_str = request.data.get('date')
        if not date_str:
            return Response({
                'success': False,
                'error': 'Date is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Trigger async task
            task = auto_schedule_deliveries.delay(date_str)
            
            return Response({
                'success': True,
                'message': 'Auto-scheduling initiated',
                'task_id': task.id
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def trigger_workflow(self, request):
        """Trigger automated delivery workflow for an order"""
        from .tasks import trigger_delivery_workflow
        
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({
                'success': False,
                'error': 'Order ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Trigger async workflow
            task = trigger_delivery_workflow.delay(order_id)
            
            return Response({
                'success': True,
                'message': 'Delivery workflow triggered',
                'task_id': task.id
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get delivery analytics"""
        from django.db.models import Count, Avg
        from datetime import datetime, timedelta
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        # Default to last 30 days if no dates provided
        if not date_from:
            date_from = (datetime.now() - timedelta(days=30)).date()
        else:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            
        if not date_to:
            date_to = datetime.now().date()
        else:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
        
        # Delivery analytics
        deliveries = DeliveryDocument.objects.filter(
            scheduled_datetime__date__range=[date_from, date_to]
        )
        
        returns = ReturnDocument.objects.filter(
            due_datetime__date__range=[date_from, date_to]
        )
        
        analytics_data = {
            'period': {
                'from': date_from,
                'to': date_to
            },
            'deliveries': {
                'total': deliveries.count(),
                'by_status': deliveries.values('status').annotate(count=Count('id')),
                'completed': deliveries.filter(status=DeliveryDocument.Status.DELIVERED).count(),
                'pending': deliveries.filter(status=DeliveryDocument.Status.PENDING).count(),
                'in_transit': deliveries.filter(status=DeliveryDocument.Status.IN_TRANSIT).count(),
            },
            'returns': {
                'total': returns.count(),
                'by_status': returns.values('status').annotate(count=Count('id')),
                'completed': returns.filter(status=ReturnDocument.Status.COMPLETED).count(),
                'overdue': returns.filter(status=ReturnDocument.Status.OVERDUE).count(),
            },
            'efficiency': {
                'on_time_deliveries': deliveries.filter(
                    status=DeliveryDocument.Status.DELIVERED,
                    completed_at__lte=timezone.now()
                ).count(),
                'total_routes': DeliveryRoute.objects.filter(
                    route_date__range=[date_from, date_to]
                ).count(),
            }
        }
        
        return Response({
            'success': True,
            'data': analytics_data
        })

@api_view(['POST'])
def update_delivery_status(request, delivery_id):
    """Update delivery status and trigger workflow progression"""
    try:
        delivery = DeliveryDocument.objects.get(id=delivery_id)
        new_status = request.data.get('status')
        proof = request.data.get('proof_of_delivery')
        
        if new_status not in [choice[0] for choice in DeliveryDocument.Status.choices]:
            return Response({
                'success': False,
                'error': 'Invalid status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        delivery.status = new_status
        if proof:
            delivery.proof_of_delivery = proof
        
        if new_status == DeliveryDocument.Status.DELIVERED:
            delivery.completed_at = timezone.now()
            # Trigger completion processing
            from .tasks import process_delivery_completion
            process_delivery_completion.delay(str(delivery.id))
        
        delivery.save()
        
        return Response({
            'success': True,
            'message': 'Status updated successfully',
            'data': DeliveryDocumentSerializer(delivery).data
        })
        
    except DeliveryDocument.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Delivery not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def update_return_status(request, return_id):
    """Update return status and process completion"""
    try:
        return_doc = ReturnDocument.objects.get(id=return_id)
        new_status = request.data.get('status')
        
        if new_status not in [choice[0] for choice in ReturnDocument.Status.choices]:
            return Response({
                'success': False,
                'error': 'Invalid status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return_doc.status = new_status
        
        if new_status == ReturnDocument.Status.COMPLETED:
            return_doc.completed_at = timezone.now()
            # Trigger completion processing
            from .tasks import process_return_completion
            process_return_completion.delay(str(return_doc.id))
        
        return_doc.save()
        
        return Response({
            'success': True,
            'message': 'Return status updated successfully',
            'data': ReturnDocumentSerializer(return_doc).data
        })
        
    except ReturnDocument.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Return document not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Original delivery overview function
@api_view(['GET'])
def delivery_overview(request):
    """Get delivery overview statistics"""
    today = datetime.now().date()
    
    total_deliveries = DeliveryDocument.objects.count()
    pending_deliveries = DeliveryDocument.objects.filter(
        status__in=[DeliveryDocument.Status.PENDING, DeliveryDocument.Status.SCHEDULED]
    ).count()
    completed_deliveries = DeliveryDocument.objects.filter(
        status=DeliveryDocument.Status.DELIVERED
    ).count()
    
    todays_deliveries = DeliveryDocument.objects.filter(
        scheduled_datetime__date=today
    ).count()
    
    overdue_returns = ReturnDocument.objects.filter(
        due_datetime__lt=timezone.now(),
        status__in=[ReturnDocument.Status.PENDING, ReturnDocument.Status.SCHEDULED]
    ).count()
    
    return Response({
        'status': 'success',
        'message': 'Delivery overview retrieved successfully',
        'data': {
            'total_deliveries': total_deliveries,
            'pending_deliveries': pending_deliveries,
            'completed_deliveries': completed_deliveries,
            'todays_deliveries': todays_deliveries,
            'overdue_returns': overdue_returns,
            'workflow_status': 'automated'  # Indicates automated workflow is active
        }
    })

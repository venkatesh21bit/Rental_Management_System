from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    DeliveryDocument, DeliveryItem, ReturnDocument, ReturnItem,
    StockMovement, DeliveryRoute
)
from apps.orders.serializers import RentalOrderSerializer
from apps.catalog.serializers import ProductSerializer

User = get_user_model()


class DeliveryItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = DeliveryItem
        fields = [
            'id', 'product', 'product_id', 'quantity_requested',
            'quantity_delivered', 'serial_numbers', 'condition_notes',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DeliveryDocumentSerializer(serializers.ModelSerializer):
    order = RentalOrderSerializer(source='reservation.order', read_only=True)
    order_id = serializers.UUIDField(write_only=True)
    items = DeliveryItemSerializer(many=True, read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    
    class Meta:
        model = DeliveryDocument
        fields = [
            'id', 'document_number', 'order', 'order_id', 'document_type',
            'status', 'scheduled_datetime', 'completed_at',
            'delivery_address', 'driver', 'driver_name', 'vehicle',
            'customer_signature', 'driver_signature', 'current_latitude', 'current_longitude',
            'notes', 'photos', 'created_at', 'updated_at',
            'items'
        ]
        read_only_fields = [
            'id', 'document_number', 'created_at', 'updated_at'
        ]


class ReturnItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = ReturnItem
        fields = [
            'id', 'product', 'product_id', 'quantity_expected',
            'quantity_returned', 'condition_rating', 'condition_notes',
            'damage_reported', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReturnDocumentSerializer(serializers.ModelSerializer):
    order = RentalOrderSerializer(read_only=True)
    order_id = serializers.UUIDField(write_only=True)
    items = ReturnItemSerializer(many=True, read_only=True)
    inspector_name = serializers.CharField(source='inspector.get_full_name', read_only=True)
    
    class Meta:
        model = ReturnDocument
        fields = [
            'id', 'document_number', 'order', 'order_id', 'return_type',
            'status', 'scheduled_datetime', 'actual_return_datetime',
            'return_address', 'inspector', 'inspector_name',
            'customer_signature', 'inspector_signature', 'overall_condition',
            'return_notes', 'damage_assessment', 'late_fee_applicable',
            'late_fee_amount', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = [
            'id', 'document_number', 'created_at', 'updated_at'
        ]


class StockMovementSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_id', 'movement_type', 'quantity',
            'location_from', 'location_to', 'reference_document',
            'reference_id', 'serial_numbers', 'notes', 'created_by',
            'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DeliveryRouteSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    delivery_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryRoute
        fields = [
            'id', 'route_name', 'driver', 'driver_name', 'vehicle_info',
            'route_date', 'status', 'start_time', 'end_time',
            'total_distance', 'estimated_duration', 'actual_duration',
            'fuel_cost', 'route_notes', 'gps_tracking_data',
            'created_at', 'updated_at', 'delivery_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_delivery_count(self, obj):
        return obj.deliveries.count()


class DeliveryScheduleSerializer(serializers.Serializer):
    """Serializer for delivery scheduling requests"""
    order_id = serializers.UUIDField()
    delivery_type = serializers.ChoiceField(choices=DeliveryDocument.DocumentType.choices)
    scheduled_datetime = serializers.DateTimeField()
    delivery_address = serializers.CharField()
    driver_id = serializers.UUIDField(required=False)
    vehicle_info = serializers.CharField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    """Serializer for delivery status updates"""
    status = serializers.ChoiceField(choices=DeliveryDocument.Status.choices)
    actual_delivery_datetime = serializers.DateTimeField(required=False)
    gps_coordinates = serializers.DictField(required=False)
    delivery_notes = serializers.CharField(required=False, allow_blank=True)
    proof_of_delivery = serializers.CharField(required=False)


class ReturnProcessSerializer(serializers.Serializer):
    """Serializer for return processing"""
    items = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
    overall_condition = serializers.ChoiceField(choices=[
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('damaged', 'Damaged'),
        ('missing', 'Missing')
    ])
    return_notes = serializers.CharField(required=False, allow_blank=True)
    damage_assessment = serializers.CharField(required=False, allow_blank=True)
    late_fee_applicable = serializers.BooleanField(default=False)


class BulkDeliveryUpdateSerializer(serializers.Serializer):
    """Serializer for bulk delivery updates"""
    delivery_ids = serializers.ListField(child=serializers.UUIDField())
    action = serializers.ChoiceField(choices=['schedule', 'dispatch', 'complete', 'cancel'])
    scheduled_datetime = serializers.DateTimeField(required=False)
    driver_id = serializers.UUIDField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

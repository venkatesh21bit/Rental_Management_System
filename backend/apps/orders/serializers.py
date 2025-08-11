from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    RentalQuote, QuoteItem, RentalOrder, RentalItem,
    Reservation, ReservationItem, RentalContract
)
# from apps.catalog.serializers import ProductSerializer  # TODO: Implement when catalog serializers are created
# from apps.accounts.serializers import UserProfileSerializer  # TODO: Implement when accounts serializers are created

User = get_user_model()


class QuoteItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = QuoteItem
        fields = [
            'id', 'product', 'product_id', 'quantity', 'rental_unit',
            'unit_price', 'discount_percent', 'discount_amount', 'line_total',
            'start_datetime', 'end_datetime', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'line_total', 'created_at']
    
    def validate(self, data):
        if data['start_datetime'] >= data['end_datetime']:
            raise serializers.ValidationError("End datetime must be after start datetime")
        return data


class RentalQuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True)
    customer = UserProfileSerializer(read_only=True)
    created_by = UserProfileSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='customer', 
        write_only=True
    )
    
    class Meta:
        model = RentalQuote
        fields = [
            'id', 'quote_number', 'customer', 'customer_id', 'created_by',
            'status', 'valid_until', 'price_list', 'subtotal', 'discount_amount',
            'tax_amount', 'total_amount', 'currency', 'notes', 'terms_conditions',
            'metadata', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = [
            'id', 'quote_number', 'created_by', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        items_data = self.context['request'].data.get('items', [])
        quote = RentalQuote.objects.create(**validated_data)
        
        total_amount = 0
        for item_data in items_data:
            item_serializer = QuoteItemSerializer(data=item_data)
            if item_serializer.is_valid():
                item = item_serializer.save(quote=quote)
                total_amount += item.line_total
            else:
                raise serializers.ValidationError(item_serializer.errors)
        
        quote.subtotal = total_amount
        quote.total_amount = total_amount + quote.tax_amount - quote.discount_amount
        quote.save()
        
        return quote


class RentalItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = RentalItem
        fields = [
            'id', 'product', 'product_id', 'quantity', 'rental_unit',
            'unit_price', 'discount_percent', 'discount_amount', 'line_total',
            'start_datetime', 'end_datetime', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'line_total', 'created_at']
    
    def validate(self, data):
        if data['start_datetime'] >= data['end_datetime']:
            raise serializers.ValidationError("End datetime must be after start datetime")
        return data


class ReservationItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = ReservationItem
        fields = [
            'id', 'product', 'product_id', 'quantity',
            'start_datetime', 'end_datetime', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReservationSerializer(serializers.ModelSerializer):
    items = ReservationItemSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer = UserProfileSerializer(source='order.customer', read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'order', 'order_number', 'customer', 'status',
            'reserved_at', 'pickup_scheduled_at', 'actual_pickup_at',
            'return_due_at', 'actual_return_at', 'pickup_location',
            'return_location', 'notes', 'updated_at', 'items'
        ]
        read_only_fields = [
            'id', 'reserved_at', 'updated_at', 'order_number', 'customer'
        ]


class RentalOrderSerializer(serializers.ModelSerializer):
    items = RentalItemSerializer(many=True, read_only=True)
    reservations = ReservationSerializer(many=True, read_only=True)
    customer = UserProfileSerializer(read_only=True)
    created_by = UserProfileSerializer(read_only=True)
    quote_number = serializers.CharField(source='quote.quote_number', read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='customer', 
        write_only=True
    )
    rental_duration_days = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = RentalOrder
        fields = [
            'id', 'order_number', 'quote', 'quote_number', 'customer', 'customer_id',
            'created_by', 'status', 'rental_start', 'rental_end',
            'actual_pickup_at', 'actual_return_at', 'price_list',
            'subtotal', 'discount_amount', 'tax_amount', 'deposit_amount',
            'late_fee_amount', 'total_amount', 'currency', 'pickup_address',
            'return_address', 'notes', 'internal_notes', 'created_at',
            'updated_at', 'items', 'reservations', 'rental_duration_days',
            'is_overdue'
        ]
        read_only_fields = [
            'id', 'order_number', 'created_by', 'actual_pickup_at',
            'actual_return_at', 'late_fee_amount', 'created_at', 'updated_at',
            'rental_duration_days', 'is_overdue'
        ]
    
    def create(self, validated_data):
        items_data = self.context['request'].data.get('items', [])
        order = RentalOrder.objects.create(**validated_data)
        
        total_amount = 0
        for item_data in items_data:
            item_serializer = RentalItemSerializer(data=item_data)
            if item_serializer.is_valid():
                item = item_serializer.save(order=order)
                total_amount += item.line_total
            else:
                raise serializers.ValidationError(item_serializer.errors)
        
        order.subtotal = total_amount
        order.total_amount = total_amount + order.tax_amount - order.discount_amount
        order.save()
        
        return order
    
    def validate(self, data):
        if data['rental_start'] >= data['rental_end']:
            raise serializers.ValidationError("Rental end must be after rental start")
        return data


class RentalContractSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer = UserProfileSerializer(source='order.customer', read_only=True)
    is_signed = serializers.SerializerMethodField()
    
    class Meta:
        model = RentalContract
        fields = [
            'id', 'contract_number', 'order', 'order_number', 'customer',
            'terms_and_conditions', 'customer_signature', 'staff_signature',
            'signed_at', 'created_at', 'contract_file', 'is_signed'
        ]
        read_only_fields = [
            'id', 'contract_number', 'signed_at', 'created_at',
            'order_number', 'customer', 'is_signed'
        ]
    
    def get_is_signed(self, obj):
        return bool(obj.signed_at)


class AvailabilitySerializer(serializers.Serializer):
    """Serializer for availability check requests"""
    product_id = serializers.UUIDField()
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    quantity = serializers.IntegerField(default=1, min_value=1)
    
    def validate(self, data):
        if data['start_datetime'] >= data['end_datetime']:
            raise serializers.ValidationError("End datetime must be after start datetime")
        return data


class BatchAvailabilitySerializer(serializers.Serializer):
    """Serializer for batch availability check requests"""
    items = AvailabilitySerializer(many=True)


class AlternativeDatesSerializer(serializers.Serializer):
    """Serializer for alternative dates search"""
    product_id = serializers.UUIDField()
    preferred_start = serializers.DateTimeField()
    preferred_end = serializers.DateTimeField()
    quantity = serializers.IntegerField(default=1, min_value=1)
    search_days = serializers.IntegerField(default=30, min_value=1, max_value=90)
    
    def validate(self, data):
        if data['preferred_start'] >= data['preferred_end']:
            raise serializers.ValidationError("Preferred end must be after preferred start")
        return data


class ProductCalendarSerializer(serializers.Serializer):
    """Serializer for product availability calendar"""
    product_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    
    def validate(self, data):
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    PriceList, PriceListItem, PricingRule, SeasonalPricing,
    VolumeDiscount, LoyaltyDiscount, LateFee
)

User = get_user_model()


class PriceListItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = PriceListItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'price',
            'currency', 'rental_unit', 'min_duration', 'max_duration',
            'is_active', 'effective_from', 'effective_to'
        ]
        read_only_fields = ['id']


class PriceListSerializer(serializers.ModelSerializer):
    items = PriceListItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PriceList
        fields = [
            'id', 'name', 'description', 'currency', 'customer_segment',
            'is_default', 'is_active', 'effective_from', 'effective_to',
            'created_at', 'updated_at', 'items', 'item_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_item_count(self, obj):
        return obj.items.filter(is_active=True).count()


class PricingRuleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = PricingRule
        fields = [
            'id', 'name', 'product', 'product_name', 'category',
            'rule_type', 'value', 'min_quantity', 'max_quantity',
            'min_duration', 'max_duration', 'rental_unit',
            'priority', 'is_active', 'effective_from', 'effective_to',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SeasonalPricingSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = SeasonalPricing
        fields = [
            'id', 'name', 'product', 'product_name', 'start_date',
            'end_date', 'multiplier', 'fixed_amount', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data


class VolumeDiscountSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = VolumeDiscount
        fields = [
            'id', 'name', 'product', 'product_name', 'category',
            'min_quantity', 'discount_type', 'discount_value',
            'is_active', 'effective_from', 'effective_to',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data['min_quantity'] <= 0:
            raise serializers.ValidationError("Minimum quantity must be greater than 0")
        
        if data['discount_type'] == 'PERCENTAGE' and data['discount_value'] > 100:
            raise serializers.ValidationError("Percentage discount cannot exceed 100%")
        
        return data


class LoyaltyDiscountSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    
    class Meta:
        model = LoyaltyDiscount
        fields = [
            'id', 'customer', 'customer_name', 'discount_type',
            'discount_value', 'min_order_value', 'max_discount_amount',
            'usage_limit', 'usage_count', 'is_active',
            'effective_from', 'effective_to', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data['discount_type'] == 'PERCENTAGE' and data['discount_value'] > 100:
            raise serializers.ValidationError("Percentage discount cannot exceed 100%")
        
        if data.get('effective_from') and data.get('effective_to'):
            if data['effective_from'] >= data['effective_to']:
                raise serializers.ValidationError("End date must be after start date")
        
        return data


class LateFeeSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = LateFee
        fields = [
            'id', 'product', 'product_name', 'category', 'fee_type',
            'fee_value', 'grace_period_hours', 'max_fee_amount',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data['grace_period_hours'] < 0:
            raise serializers.ValidationError("Grace period cannot be negative")
        
        if data['fee_type'] == 'PERCENTAGE' and data['fee_value'] > 100:
            raise serializers.ValidationError("Percentage fee cannot exceed 100%")
        
        return data


class PriceCalculationRequestSerializer(serializers.Serializer):
    """Serializer for price calculation requests"""
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    customer_id = serializers.UUIDField(required=False)
    rental_unit = serializers.ChoiceField(
        choices=['HOUR', 'DAY', 'WEEK', 'MONTH'],
        default='DAY'
    )
    
    def validate(self, data):
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data


class PriceCalculationResponseSerializer(serializers.Serializer):
    """Serializer for price calculation responses"""
    product_id = serializers.UUIDField()
    product_name = serializers.CharField()
    quantity = serializers.IntegerField()
    rental_duration = serializers.IntegerField()
    rental_unit = serializers.CharField()
    base_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    seasonal_adjustment = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    volume_discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    loyalty_discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(default='INR')
    applied_rules = serializers.ListField(child=serializers.CharField(), default=list)


class LateFeeCalculationRequestSerializer(serializers.Serializer):
    """Serializer for late fee calculation requests"""
    product_id = serializers.UUIDField()
    return_due_date = serializers.DateTimeField()
    actual_return_date = serializers.DateTimeField()
    quantity = serializers.IntegerField(min_value=1)
    
    def validate(self, data):
        if data['actual_return_date'] <= data['return_due_date']:
            raise serializers.ValidationError("Actual return date must be after due date for late fees")
        return data


class LateFeeCalculationResponseSerializer(serializers.Serializer):
    """Serializer for late fee calculation responses"""
    product_id = serializers.UUIDField()
    product_name = serializers.CharField()
    quantity = serializers.IntegerField()
    late_hours = serializers.IntegerField()
    grace_period_hours = serializers.IntegerField()
    billable_hours = serializers.IntegerField()
    fee_per_hour = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_late_fee = serializers.DecimalField(max_digits=12, decimal_places=2)
    max_fee_applied = serializers.BooleanField(default=False)
    currency = serializers.CharField(default='INR')


class BulkPriceUpdateSerializer(serializers.Serializer):
    """Serializer for bulk price updates"""
    price_list_id = serializers.UUIDField()
    updates = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
    
    def validate_updates(self, value):
        required_fields = ['product_id', 'price']
        for update in value:
            for field in required_fields:
                if field not in update:
                    raise serializers.ValidationError(f"Missing required field: {field}")
        return value

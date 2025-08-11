from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PriceList, PriceRule, LateFeeRule

User = get_user_model()


class PriceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceList
        fields = [
            'id', 'name', 'description', 'currency', 'customer_group',
            'is_default', 'valid_from', 'valid_to', 'priority', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PricingRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceRule
        fields = [
            'id', 'name', 'price_list', 'product', 'category',
            'customer_group', 'unit_type', 'base_price', 'discount_type',
            'discount_value', 'min_quantity', 'max_quantity',
            'valid_from', 'valid_to', 'is_active', 'priority',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LateFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LateFeeRule
        fields = [
            'id', 'name', 'description', 'fee_type', 'fee_amount',
            'grace_period_hours', 'max_fee_amount', 'applies_to_products',
            'applies_to_categories', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PriceCalculationRequestSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    unit_type = serializers.CharField(default='DAY')
    quantity = serializers.IntegerField(default=1)


class PriceCalculationResponseSerializer(serializers.Serializer):
    base_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    quantity = serializers.IntegerField()
    duration_days = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    applied_rules = serializers.ListField(child=serializers.DictField(), default=list)


class LateFeeCalculationRequestSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    actual_return_date = serializers.DateTimeField()


class LateFeeCalculationResponseSerializer(serializers.Serializer):
    overdue_days = serializers.IntegerField()
    daily_late_fee = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    total_late_fee = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()

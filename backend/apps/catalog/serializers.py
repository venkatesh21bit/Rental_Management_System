from rest_framework import serializers
from .models import ProductCategory, Product, ProductImage, ProductItem
from django.db.models import Min


class ProductCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    product_count = serializers.SerializerMethodField()
    full_path = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductCategory
        fields = [
            'id', 'name', 'description', 'parent', 'parent_name', 'image',
            'is_active', 'created_at', 'updated_at', 'children', 'product_count',
            'full_path'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_children(self, obj):
        if hasattr(obj, 'children'):
            return ProductCategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True, rentable=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            'id', 'image', 'alt_text', 'is_primary', 'sort_order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProductItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    is_available_for_rental = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductItem
        fields = [
            'id', 'product', 'product_name', 'serial_number', 'internal_code',
            'status', 'condition_rating', 'condition_notes', 'location',
            'last_service_date', 'next_service_date', 'is_available_for_rental',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_path = serializers.CharField(source='category.full_path', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    items = ProductItemSerializer(many=True, read_only=True)
    available_quantity = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    primary_image = serializers.SerializerMethodField()
    
    # Pricing information from pricing app
    daily_rate = serializers.SerializerMethodField()
    weekly_rate = serializers.SerializerMethodField()
    monthly_rate = serializers.SerializerMethodField()
    hourly_rate = serializers.SerializerMethodField()
    security_deposit = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'description', 'category', 'category_name',
            'category_path', 'rentable', 'tracking', 'default_rental_unit',
            'min_rental_duration', 'max_rental_duration', 'quantity_on_hand',
            'quantity_reserved', 'quantity_rented', 'available_quantity',
            'weight', 'dimensions', 'brand', 'model', 'year', 'condition_notes',
            'is_active', 'is_available', 'created_at', 'updated_at', 'images',
            'items', 'primary_image', 'daily_rate', 'weekly_rate', 'monthly_rate',
            'hourly_rate', 'security_deposit'
        ]
        read_only_fields = [
            'id', 'available_quantity', 'is_available', 'created_at', 'updated_at',
            'daily_rate', 'weekly_rate', 'monthly_rate', 'hourly_rate', 'security_deposit'
        ]
    
    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ProductImageSerializer(primary_image).data
        elif obj.images.exists():
            return ProductImageSerializer(obj.images.first()).data
        return None
    
    def get_daily_rate(self, obj):
        """Get daily rental rate from pricing rules"""
        try:
            from apps.pricing.models import PriceRule
            rule = PriceRule.objects.filter(
                product=obj,
                is_active=True,
                rate_day__isnull=False
            ).first()
            return float(rule.rate_day) if rule else None
        except ImportError:
            return None
    
    def get_weekly_rate(self, obj):
        """Get weekly rental rate from pricing rules"""
        try:
            from apps.pricing.models import PriceRule
            rule = PriceRule.objects.filter(
                product=obj,
                is_active=True,
                rate_week__isnull=False
            ).first()
            return float(rule.rate_week) if rule else None
        except ImportError:
            return None
    
    def get_monthly_rate(self, obj):
        """Get monthly rental rate from pricing rules"""
        try:
            from apps.pricing.models import PriceRule
            rule = PriceRule.objects.filter(
                product=obj,
                is_active=True,
                rate_month__isnull=False
            ).first()
            return float(rule.rate_month) if rule else None
        except ImportError:
            return None
    
    def get_hourly_rate(self, obj):
        """Get hourly rental rate from pricing rules"""
        try:
            from apps.pricing.models import PriceRule
            rule = PriceRule.objects.filter(
                product=obj,
                is_active=True,
                rate_hour__isnull=False
            ).first()
            return float(rule.rate_hour) if rule else None
        except ImportError:
            return None
    
    def get_security_deposit(self, obj):
        """Get security deposit amount - could be a percentage of daily rate"""
        daily_rate = self.get_daily_rate(obj)
        if daily_rate:
            # Default to 100% of daily rate as security deposit
            return daily_rate
        return None


class ProductListSerializer(ProductSerializer):
    """Simplified serializer for product lists"""
    class Meta(ProductSerializer.Meta):
        fields = [
            'id', 'sku', 'name', 'description', 'category_name', 'category_path',
            'rentable', 'default_rental_unit', 'available_quantity', 'brand',
            'model', 'is_active', 'is_available', 'primary_image', 'daily_rate',
            'weekly_rate', 'monthly_rate', 'hourly_rate', 'security_deposit'
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products"""
    class Meta:
        model = Product
        fields = [
            'sku', 'name', 'description', 'category', 'rentable', 'tracking',
            'default_rental_unit', 'min_rental_duration', 'max_rental_duration',
            'quantity_on_hand', 'weight', 'dimensions', 'brand', 'model',
            'year', 'condition_notes', 'is_active'
        ]
    
    def validate_sku(self, value):
        # Check for unique SKU
        if self.instance:
            if Product.objects.exclude(pk=self.instance.pk).filter(sku=value).exists():
                raise serializers.ValidationError("Product with this SKU already exists")
        else:
            if Product.objects.filter(sku=value).exists():
                raise serializers.ValidationError("Product with this SKU already exists")
        return value
    
    def validate(self, data):
        if data.get('min_rental_duration', 0) <= 0:
            raise serializers.ValidationError("Minimum rental duration must be greater than 0")
        
        max_duration = data.get('max_rental_duration')
        min_duration = data.get('min_rental_duration', 1)
        
        if max_duration and max_duration < min_duration:
            raise serializers.ValidationError("Maximum rental duration must be greater than minimum")
        
        return data


class ProductAvailabilitySerializer(serializers.Serializer):
    """Serializer for availability check response"""
    product_id = serializers.UUIDField()
    is_available = serializers.BooleanField()
    available_quantity = serializers.IntegerField()
    requested_quantity = serializers.IntegerField()
    next_available_date = serializers.DateTimeField(allow_null=True)
    unavailable_dates = serializers.ListField(
        child=serializers.DateTimeField(),
        default=list
    )


class ProductSearchSerializer(serializers.Serializer):
    """Serializer for product search parameters"""
    search = serializers.CharField(required=False, allow_blank=True)
    category = serializers.UUIDField(required=False)
    is_rentable = serializers.BooleanField(required=False)
    availability = serializers.BooleanField(required=False)
    brand = serializers.CharField(required=False, allow_blank=True)
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    sort_by = serializers.ChoiceField(
        choices=['name', 'brand', 'category', 'created_at', 'available_quantity'],
        default='name'
    )
    sort_order = serializers.ChoiceField(choices=['asc', 'desc'], default='asc')


class BulkProductUpdateSerializer(serializers.Serializer):
    """Serializer for bulk product updates"""
    product_ids = serializers.ListField(child=serializers.UUIDField())
    action = serializers.ChoiceField(choices=['activate', 'deactivate', 'update_category'])
    category = serializers.UUIDField(required=False)
    
    def validate(self, data):
        if data['action'] == 'update_category' and not data.get('category'):
            raise serializers.ValidationError("Category is required for update_category action")
        return data

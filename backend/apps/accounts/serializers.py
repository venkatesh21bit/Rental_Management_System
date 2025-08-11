from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, CustomerGroup, Address

User = get_user_model()


class CustomerGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerGroup
        fields = ['id', 'name', 'description', 'discount_percent']


class UserProfileSerializer(serializers.ModelSerializer):
    customer_group = CustomerGroupSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = [
            'role', 'customer_group', 'phone', 'address', 'city', 'state',
            'postal_code', 'country', 'company_name', 'tax_id',
            'preferred_currency', 'notification_email', 'notification_sms',
            'is_verified', 'is_active', 'full_name', 'display_name'
        ]
        read_only_fields = ['role', 'is_verified']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'date_joined', 'profile'
        ]
        read_only_fields = ['id', 'username', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=True)
    address = serializers.CharField(required=True)
    city = serializers.CharField(required=True)
    state = serializers.CharField(required=True)
    postal_code = serializers.CharField(required=True)
    country = serializers.CharField(default='India')
    company_name = serializers.CharField(required=False, allow_blank=True)
    customer_type = serializers.ChoiceField(
        choices=[('individual', 'Individual'), ('corporate', 'Corporate')],
        default='individual'
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password',
            'password_confirm', 'phone', 'address', 'city', 'state',
            'postal_code', 'country', 'company_name', 'customer_type'
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        # Remove password_confirm and profile fields
        password_confirm = validated_data.pop('password_confirm')
        profile_data = {
            'phone': validated_data.pop('phone'),
            'address': validated_data.pop('address'),
            'city': validated_data.pop('city'),
            'state': validated_data.pop('state'),
            'postal_code': validated_data.pop('postal_code'),
            'country': validated_data.pop('country'),
            'company_name': validated_data.pop('company_name', ''),
        }
        customer_type = validated_data.pop('customer_type', 'individual')

        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Create profile
        UserProfile.objects.create(
            user=user,
            role=UserProfile.Role.CUSTOMER,
            **profile_data
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
                user = authenticate(username=user.username, password=password)
                if not user:
                    raise serializers.ValidationError('Invalid credentials')
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled')
                
            data['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return data

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            if not user.is_active:
                raise serializers.ValidationError("Account is disabled")
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data


class RefreshTokenSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()

    def validate_refresh_token(self, value):
        try:
            refresh = RefreshToken(value)
            return refresh
        except Exception:
            raise serializers.ValidationError("Invalid refresh token")


class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['notification_email', 'notification_sms']


class CustomerStatsSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_rentals = serializers.IntegerField()
    completed_rentals = serializers.IntegerField()
    average_order_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    last_order_date = serializers.DateTimeField(allow_null=True)
    customer_since = serializers.DateTimeField()


class AddressSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()
    
    class Meta:
        model = Address
        fields = [
            'id', 'type', 'first_name', 'last_name', 'company',
            'address_line_1', 'address_line_2', 'city', 'state',
            'postal_code', 'country', 'phone', 'is_default',
            'is_active', 'full_name', 'full_address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'full_name', 'full_address']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

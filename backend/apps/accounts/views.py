from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Sum, Avg
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils import timezone
from datetime import datetime, timedelta

from .models import UserProfile, CustomerGroup, Address
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, UserProfileSerializer,
    ChangePasswordSerializer, PasswordResetSerializer, PasswordResetConfirmSerializer,
    RefreshTokenSerializer, NotificationSettingsSerializer, CustomerStatsSerializer,
    CustomerGroupSerializer, AddressSerializer
)

User = get_user_model()


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register new customer account"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        # Get user data with profile
        user_serializer = UserSerializer(user)
        
        return Response({
            'success': True,
            'message': 'Account created successfully',
            'data': {
                'user': user_serializer.data,
                'token': access_token,
                'refresh_token': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Registration failed',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate user with email and password"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        # Get user data with profile and stats
        user_serializer = UserSerializer(user)
        
        # Get customer stats if customer
        customer_stats = None
        if hasattr(user, 'profile') and user.profile.role == UserProfile.Role.CUSTOMER:
            from apps.orders.models import RentalOrder
            
            orders = RentalOrder.objects.filter(customer=user)
            stats_data = orders.aggregate(
                total_orders=Count('id'),
                total_spent=Sum('total_amount'),
                average_order_value=Avg('total_amount')
            )
            
            active_rentals = orders.filter(
                status__in=['PICKED_UP', 'ACTIVE']
            ).count()
            
            completed_rentals = orders.filter(
                status='RETURNED'
            ).count()
            
            last_order = orders.order_by('-created_at').first()
            
            customer_stats = {
                'total_orders': stats_data['total_orders'] or 0,
                'total_spent': stats_data['total_spent'] or 0,
                'active_rentals': active_rentals,
                'completed_rentals': completed_rentals,
                'average_order_value': stats_data['average_order_value'] or 0,
                'last_order_date': last_order.created_at if last_order else None,
                'customer_since': user.date_joined
            }
        
        response_data = {
            'user': user_serializer.data,
            'token': access_token,
            'refresh_token': str(refresh)
        }
        
        if customer_stats:
            response_data['user']['stats'] = customer_stats
        
        return Response({
            'success': True,
            'data': response_data
        })
    
    return Response({
        'success': False,
        'error': {
            'code': 'INVALID_CREDENTIALS',
            'message': 'Invalid email or password',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout user and invalidate tokens"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': {
                'code': 'LOGOUT_ERROR',
                'message': 'Error during logout',
                'details': str(e)
            }
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh access token"""
    serializer = RefreshTokenSerializer(data=request.data)
    if serializer.is_valid():
        refresh = serializer.validated_data['refresh_token']
        access_token = str(refresh.access_token)
        
        return Response({
            'success': True,
            'data': {
                'token': access_token
            }
        })
    
    return Response({
        'success': False,
        'error': {
            'code': 'INVALID_TOKEN',
            'message': 'Invalid refresh token',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Send password reset email"""
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # In production, send actual email
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        
        # For development, just return the token
        if settings.DEBUG:
            return Response({
                'success': True,
                'message': 'Password reset email sent',
                'data': {
                    'reset_url': reset_url,
                    'token': token,
                    'uid': uid
                }
            })
        
        # Send email (implement email service)
        send_mail(
            'Password Reset',
            f'Click here to reset your password: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        return Response({
            'success': True,
            'message': 'Password reset email sent'
        })
    
    return Response({
        'success': False,
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid email',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with token"""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Extract UID from token (if using Django's built-in system)
            # For simplicity, assuming token contains user ID
            uid = request.data.get('uid')
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
            
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                
                return Response({
                    'success': True,
                    'message': 'Password reset successfully'
                })
            else:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'INVALID_TOKEN',
                        'message': 'Invalid or expired reset token'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_TOKEN',
                    'message': 'Invalid reset token'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': False,
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Invalid data',
            'details': serializer.errors
        }
    }, status=status.HTTP_400_BAD_REQUEST)


# User Management ViewSets
class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return UserProfile.objects.all().select_related('user', 'customer_group')
        return UserProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        try:
            profile = request.user.profile
            serializer = self.get_serializer(profile)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except UserProfile.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'PROFILE_NOT_FOUND',
                    'message': 'User profile not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Update current user profile"""
        try:
            profile = request.user.profile
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Profile updated successfully',
                    'data': serializer.data
                })
            
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except UserProfile.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'PROFILE_NOT_FOUND',
                    'message': 'User profile not found'
                }
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'success': True,
                'message': 'Password changed successfully'
            })
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Password change failed',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get customer statistics"""
        if not hasattr(request.user, 'profile') or request.user.profile.role != UserProfile.Role.CUSTOMER:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Only customers can view stats'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        from apps.orders.models import RentalOrder
        
        orders = RentalOrder.objects.filter(customer=request.user)
        stats_data = orders.aggregate(
            total_orders=Count('id'),
            total_spent=Sum('total_amount'),
            average_order_value=Avg('total_amount')
        )
        
        active_rentals = orders.filter(
            status__in=['PICKED_UP', 'ACTIVE']
        ).count()
        
        completed_rentals = orders.filter(
            status='RETURNED'
        ).count()
        
        last_order = orders.order_by('-created_at').first()
        
        stats = {
            'total_orders': stats_data['total_orders'] or 0,
            'total_spent': stats_data['total_spent'] or 0,
            'active_rentals': active_rentals,
            'completed_rentals': completed_rentals,
            'average_order_value': stats_data['average_order_value'] or 0,
            'last_order_date': last_order.created_at if last_order else None,
            'customer_since': request.user.date_joined
        }
        
        serializer = CustomerStatsSerializer(stats)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def orders(self, request):
        """Get customer order history"""
        from apps.orders.models import RentalOrder
        from apps.orders.serializers import RentalOrderSerializer
        
        orders = RentalOrder.objects.filter(customer=request.user).order_by('-created_at')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = min(int(request.query_params.get('limit', 20)), 100)
        offset = (page - 1) * limit
        
        total = orders.count()
        orders_page = orders[offset:offset + limit]
        
        serializer = RentalOrderSerializer(orders_page, many=True)
        
        return Response({
            'success': True,
            'data': {
                'orders': serializer.data,
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


class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only customer management"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return User.objects.none()
        
        return User.objects.filter(
            profile__role=UserProfile.Role.CUSTOMER
        ).select_related('profile').order_by('-date_joined')
    
    def list(self, request):
        """Get all customers with pagination and filtering"""
        queryset = self.get_queryset()
        
        # Filtering
        search = request.query_params.get('search')
        customer_type = request.query_params.get('customer_type')
        
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(profile__company_name__icontains=search)
            )
        
        if customer_type in ['individual', 'corporate']:
            if customer_type == 'individual':
                queryset = queryset.filter(profile__company_name='')
            else:
                queryset = queryset.exclude(profile__company_name='')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = min(int(request.query_params.get('limit', 20)), 100)
        offset = (page - 1) * limit
        
        total = queryset.count()
        customers_page = queryset[offset:offset + limit]
        
        serializer = self.get_serializer(customers_page, many=True)
        
        return Response({
            'success': True,
            'data': {
                'customers': serializer.data,
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
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get specific customer statistics"""
        customer = self.get_object()
        
        from apps.orders.models import RentalOrder
        
        orders = RentalOrder.objects.filter(customer=customer)
        stats_data = orders.aggregate(
            total_orders=Count('id'),
            total_spent=Sum('total_amount'),
            average_order_value=Avg('total_amount')
        )
        
        active_rentals = orders.filter(
            status__in=['PICKED_UP', 'ACTIVE']
        ).count()
        
        completed_rentals = orders.filter(
            status='RETURNED'
        ).count()
        
        last_order = orders.order_by('-created_at').first()
        
        stats = {
            'total_orders': stats_data['total_orders'] or 0,
            'total_spent': stats_data['total_spent'] or 0,
            'active_rentals': active_rentals,
            'completed_rentals': completed_rentals,
            'average_order_value': stats_data['average_order_value'] or 0,
            'last_order_date': last_order.created_at if last_order else None,
            'customer_since': customer.date_joined
        }
        
        serializer = CustomerStatsSerializer(stats)
        return Response({
            'success': True,
            'data': serializer.data
        })


class CustomerGroupViewSet(viewsets.ModelViewSet):
    """Customer group management"""
    queryset = CustomerGroup.objects.all()
    serializer_class = CustomerGroupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]  # Add admin check in production


class AddressViewSet(viewsets.ModelViewSet):
    """Address management for users"""
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_destroy(self, instance):
        # Soft delete
        instance.is_active = False
        instance.save()
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set address as default"""
        address = self.get_object()
        
        # Remove default from other addresses of same type
        Address.objects.filter(
            user=request.user,
            type=address.type,
            is_default=True
        ).update(is_default=False)
        
        # Set this as default
        address.is_default = True
        address.save()
        
        return Response({
            'success': True,
            'message': 'Address set as default'
        })

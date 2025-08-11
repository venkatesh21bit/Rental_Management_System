from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from .models import PriceList, PriceRule, LateFeeRule
from apps.catalog.models import Product


class PricingService:
    """Service for calculating rental prices and late fees"""
    
    @staticmethod
    def get_applicable_price_list(customer_group=None, date=None):
        """Get the most applicable price list for a customer group and date"""
        if date is None:
            date = timezone.now().date()
        
        # Start with all active price lists
        price_lists = PriceList.objects.filter(is_active=True)
        
        # Filter by customer group
        if customer_group:
            price_lists = price_lists.filter(
                models.Q(customer_group=customer_group) | 
                models.Q(customer_group__isnull=True)
            )
        else:
            # If no customer group, only consider general price lists
            price_lists = price_lists.filter(customer_group__isnull=True)
        
        # Filter by validity dates
        price_lists = price_lists.filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=date)
        ).filter(
            models.Q(valid_to__isnull=True) | models.Q(valid_to__gte=date)
        )
        
        # Order by priority and return the first one
        price_list = price_lists.order_by('-priority', '-is_default').first()
        
        if not price_list:
            # Fallback to default price list
            price_list = PriceList.objects.filter(
                is_default=True, 
                is_active=True
            ).first()
        
        return price_list
    
    @staticmethod
    def get_applicable_price_rule(product, price_list, duration_hours, quantity=1, date=None):
        """Get the most applicable price rule for a product"""
        if date is None:
            date = timezone.now().date()
        
        if not price_list:
            return None
        
        # Get all rules for this price list
        rules = price_list.rules.filter(is_active=True)
        
        # Filter by product or category
        rules = rules.filter(
            models.Q(product=product) | 
            models.Q(category=product.category)
        )
        
        # Filter by validity dates
        rules = rules.filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=date)
        ).filter(
            models.Q(valid_to__isnull=True) | models.Q(valid_to__gte=date)
        )
        
        # Filter by minimum requirements
        rules = rules.filter(
            min_duration_hours__lte=duration_hours,
            min_quantity__lte=quantity
        )
        
        # Order by specificity and requirements
        rule = rules.order_by(
            '-product_id',  # Product-specific rules first
            '-min_duration_hours',  # Higher duration requirements first
            '-min_quantity'  # Higher quantity requirements first
        ).first()
        
        return rule
    
    @staticmethod
    def calculate_base_price(product, start_datetime, end_datetime, quantity=1):
        """Calculate base rental price without discounts"""
        duration = end_datetime - start_datetime
        total_hours = Decimal(str(duration.total_seconds() / 3600))
        
        # Get customer group from context (this could be passed as parameter)
        price_list = PricingService.get_applicable_price_list()
        
        if not price_list:
            return Decimal('0.00')
        
        rule = PricingService.get_applicable_price_rule(
            product, price_list, float(total_hours), quantity
        )
        
        if not rule:
            return Decimal('0.00')
        
        # Calculate price based on best fitting time unit
        total_price = Decimal('0.00')
        remaining_hours = total_hours
        
        # Try to use larger units first for better pricing
        if rule.rate_month and remaining_hours >= 24 * 30:  # ~30 days
            months = remaining_hours // (24 * 30)
            total_price += Decimal(str(rule.rate_month)) * months
            remaining_hours -= months * 24 * 30
        
        if rule.rate_week and remaining_hours >= 24 * 7:  # 7 days
            weeks = remaining_hours // (24 * 7)
            total_price += Decimal(str(rule.rate_week)) * weeks
            remaining_hours -= weeks * 24 * 7
        
        if rule.rate_day and remaining_hours >= 24:  # 1 day
            days = remaining_hours // 24
            total_price += Decimal(str(rule.rate_day)) * days
            remaining_hours -= days * 24
        
        if rule.rate_hour and remaining_hours > 0:
            total_price += Decimal(str(rule.rate_hour)) * remaining_hours
        
        # Apply quantity multiplier
        total_price *= Decimal(str(quantity))
        
        return total_price.quantize(Decimal('0.01'))
    
    @staticmethod
    def apply_discount(base_price, rule):
        """Apply discount from price rule"""
        if not rule or not rule.discount_type or not rule.discount_value:
            return base_price
        
        discount_value = Decimal(str(rule.discount_value))
        
        if rule.discount_type == PriceRule.DiscountType.PERCENTAGE:
            discount_amount = base_price * discount_value / Decimal('100')
        else:  # FIXED
            discount_amount = discount_value
        
        # Ensure discount doesn't exceed base price
        discount_amount = min(discount_amount, base_price)
        
        return (base_price - discount_amount).quantize(Decimal('0.01'))
    
    @staticmethod
    def calculate_rental_price(product, start_datetime, end_datetime, quantity=1, customer_group=None):
        """Calculate final rental price including discounts"""
        duration = end_datetime - start_datetime
        total_hours = Decimal(str(duration.total_seconds() / 3600))
        
        price_list = PricingService.get_applicable_price_list(customer_group)
        
        if not price_list:
            return {
                'base_price': Decimal('0.00'),
                'discount_amount': Decimal('0.00'),
                'final_price': Decimal('0.00'),
                'currency': 'INR',
                'price_list': None,
                'price_rule': None
            }
        
        rule = PricingService.get_applicable_price_rule(
            product, price_list, float(total_hours), quantity
        )
        
        base_price = PricingService.calculate_base_price(
            product, start_datetime, end_datetime, quantity
        )
        
        final_price = PricingService.apply_discount(base_price, rule) if rule else base_price
        discount_amount = base_price - final_price
        
        return {
            'base_price': base_price,
            'discount_amount': discount_amount,
            'final_price': final_price,
            'currency': price_list.currency,
            'price_list': price_list,
            'price_rule': rule,
            'duration_hours': float(total_hours),
            'quantity': quantity
        }
    
    @staticmethod
    def calculate_late_fee(product, rental_end_datetime, actual_return_datetime, rental_amount):
        """Calculate late return fees"""
        if actual_return_datetime <= rental_end_datetime:
            return Decimal('0.00')
        
        # Get applicable late fee rule
        late_fee_rules = LateFeeRule.objects.filter(is_active=True).filter(
            models.Q(product=product) | 
            models.Q(category=product.category) |
            models.Q(product__isnull=True, category__isnull=True)  # Global rules
        ).order_by('-priority', '-product_id', '-category_id')
        
        rule = late_fee_rules.first()
        if not rule:
            return Decimal('0.00')
        
        # Calculate late duration
        late_duration = actual_return_datetime - rental_end_datetime
        
        # Apply grace period
        if late_duration.total_seconds() <= rule.grace_period_hours * 3600:
            return Decimal('0.00')
        
        actual_late_duration = late_duration - timedelta(hours=rule.grace_period_hours)
        
        # Calculate fee based on rule type
        fee_amount = Decimal('0.00')
        
        if rule.fee_type == LateFeeRule.FeeType.PERCENTAGE:
            fee_amount = rental_amount * Decimal(str(rule.fee_value)) / Decimal('100')
        
        elif rule.fee_type == LateFeeRule.FeeType.FIXED_PER_DAY:
            late_days = actual_late_duration.days
            if actual_late_duration.seconds > 0:
                late_days += 1  # Round up partial days
            
            if rule.max_fee_days:
                late_days = min(late_days, rule.max_fee_days)
            
            fee_amount = Decimal(str(rule.fee_value)) * Decimal(str(late_days))
        
        elif rule.fee_type == LateFeeRule.FeeType.FIXED_PER_HOUR:
            late_hours = actual_late_duration.total_seconds() / 3600
            if rule.max_fee_days:
                max_hours = rule.max_fee_days * 24
                late_hours = min(late_hours, max_hours)
            
            fee_amount = Decimal(str(rule.fee_value)) * Decimal(str(late_hours))
        
        # Apply maximum fee cap if specified
        if rule.max_fee_amount:
            fee_amount = min(fee_amount, Decimal(str(rule.max_fee_amount)))
        
        return fee_amount.quantize(Decimal('0.01'))


# Import models for Q objects
from django.db import models

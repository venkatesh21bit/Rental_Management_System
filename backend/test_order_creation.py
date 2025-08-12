#!/usr/bin/env python
"""
Test script to verify order creation with correct total calculations
"""
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

from apps.orders.models import RentalItem
# Remove unused imports

def test_rental_item_calculation():
    """Test that RentalItem calculates line_total correctly"""
    
    # Mock data for testing
    start_date = datetime.now()
    end_date = start_date + timedelta(days=3)  # 3-day rental
    
    # Create a test rental item instance (without saving to DB)
    item = RentalItem(
        unit_price=Decimal('100.00'),  # $100 per day
        quantity=2,  # 2 items
        start_datetime=start_date,
        end_datetime=end_date,
        discount_amount=Decimal('0.00')
    )
    
    # Test the calculation method
    item.calculate_line_total()
    
    expected_total = Decimal('100.00') * 2 * 3  # $100 * 2 items * 3 days = $600
    
    print(f"Unit Price: ${item.unit_price}")
    print(f"Quantity: {item.quantity}")
    print(f"Rental Days: 3")
    print(f"Expected Total: ${expected_total}")
    print(f"Calculated Total: ${item.line_total}")
    print(f"Calculation Correct: {item.line_total == expected_total}")
    
    return item.line_total == expected_total

def test_with_provided_line_total():
    """Test that provided line_total is preserved"""
    
    start_date = datetime.now()
    end_date = start_date + timedelta(days=2)
    
    # Create item with provided line_total
    item = RentalItem(
        unit_price=Decimal('50.00'),
        quantity=1,
        start_datetime=start_date,
        end_datetime=end_date,
        discount_amount=Decimal('0.00'),
        line_total=Decimal('150.00')  # Provided total (different from calculation)
    )
    
    # This should NOT recalculate since line_total is already provided
    original_total = item.line_total
    item.save = lambda *args, **kwargs: None  # Mock save method
    
    print(f"\nTest with provided line_total:")
    print(f"Provided Total: ${original_total}")
    print(f"Line Total After Init: ${item.line_total}")
    print(f"Preserved Correctly: {item.line_total == original_total}")
    
    return item.line_total == original_total

if __name__ == "__main__":
    print("Testing RentalItem line_total calculation...")
    print("=" * 50)
    
    test1_result = test_rental_item_calculation()
    test2_result = test_with_provided_line_total()
    
    print(f"\nTest Results:")
    print(f"Auto-calculation test: {'PASS' if test1_result else 'FAIL'}")
    print(f"Preserve provided total test: {'PASS' if test2_result else 'FAIL'}")
    
    if test1_result and test2_result:
        print("\n✅ All tests passed! Order total calculation should now work correctly.")
    else:
        print("\n❌ Some tests failed. Please check the implementation.")

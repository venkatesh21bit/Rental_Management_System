# tasks.py - Celery tasks for automated delivery workflow
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta
import logging
from .models import DeliveryDocument, ReturnDocument, StockMovement
from apps.orders.models import Reservation, Order
from apps.catalog.models import Product

logger = logging.getLogger(__name__)

@shared_task
def trigger_delivery_workflow(order_id):
    """
    Automatic delivery workflow triggered when order is confirmed:
    1. Reserve stock
    2. Create pickup document
    3. Schedule automatic return
    """
    try:
        with transaction.atomic():
            order = Order.objects.get(id=order_id)
            reservation = order.reservations.first()
            
            if not reservation:
                logger.error(f"No reservation found for order {order_id}")
                return False
            
            # Step 1: Reserve stock (create stock movement)
            for item in reservation.items.all():
                stock_movement = StockMovement.objects.create(
                    movement_type=StockMovement.MovementType.PICKUP,
                    product=item.product,
                    quantity=-item.quantity,  # Negative for outgoing
                    from_location="Available Stock",
                    to_location="Reserved for Customer",
                    reason=f"Reserved for order {order.order_number}",
                    delivery_document=None  # Will be linked when pickup is created
                )
                
                # Update product stock
                item.product.stock_available -= item.quantity
                item.product.stock_reserved += item.quantity
                item.product.save()
            
            # Step 2: Create pickup document
            pickup_document = DeliveryDocument.objects.create(
                reservation=reservation,
                document_type=DeliveryDocument.DocumentType.PICKUP,
                status=DeliveryDocument.Status.PENDING,
                pickup_address=order.warehouse_address or "Main Warehouse",
                delivery_address=order.delivery_address,
                scheduled_datetime=order.delivery_date or timezone.now() + timedelta(days=1),
                customer_contact=order.customer.phone if hasattr(order.customer, 'phone') else '',
                special_instructions=order.special_instructions or '',
            )
            
            # Create pickup items
            from .models import DeliveryItem
            for item in reservation.items.all():
                DeliveryItem.objects.create(
                    delivery_document=pickup_document,
                    product=item.product,
                    quantity_scheduled=item.quantity
                )
            
            # Step 3: Schedule automatic return document
            return_date = reservation.end_date or (timezone.now().date() + timedelta(days=7))
            return_document = ReturnDocument.objects.create(
                reservation=reservation,
                status=ReturnDocument.Status.PENDING,
                due_datetime=datetime.combine(return_date, datetime.min.time()),
                pickup_address=order.delivery_address,
                return_address=order.warehouse_address or "Main Warehouse",
                customer_contact=order.customer.phone if hasattr(order.customer, 'phone') else '',
            )
            
            # Create return items
            from .models import ReturnItem
            for item in reservation.items.all():
                ReturnItem.objects.create(
                    return_document=return_document,
                    product=item.product,
                    quantity_due=item.quantity
                )
            
            # Schedule automatic return reminder
            schedule_return_reminder.apply_async(
                args=[str(return_document.id)],
                eta=return_date - timedelta(days=1)  # Remind 1 day before due
            )
            
            logger.info(f"Delivery workflow triggered successfully for order {order_id}")
            return True
            
    except Exception as e:
        logger.error(f"Error in delivery workflow for order {order_id}: {str(e)}")
        return False

@shared_task
def auto_schedule_deliveries(date_str):
    """
    Auto-schedule deliveries for a specific date using optimization algorithms
    """
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Get all pending deliveries for the date
        pending_deliveries = DeliveryDocument.objects.filter(
            scheduled_datetime__date=target_date,
            status=DeliveryDocument.Status.PENDING
        )
        
        pending_returns = ReturnDocument.objects.filter(
            scheduled_datetime__date=target_date,
            status=ReturnDocument.Status.PENDING
        )
        
        # Simple optimization: group by geographic area (postal code)
        from collections import defaultdict
        delivery_groups = defaultdict(list)
        
        for delivery in pending_deliveries:
            # Extract postal code from address (simple approach)
            postal_code = extract_postal_code(delivery.delivery_address)
            delivery_groups[postal_code].append(delivery)
        
        for return_doc in pending_returns:
            postal_code = extract_postal_code(return_doc.pickup_address)
            delivery_groups[postal_code].append(return_doc)
        
        scheduled_count = 0
        
        # Create routes for each geographic group
        for postal_code, docs in delivery_groups.items():
            if len(docs) >= 2:  # Only create routes for multiple deliveries
                # Create delivery route
                from .models import DeliveryRoute
                route = DeliveryRoute.objects.create(
                    route_name=f"Route {postal_code} - {target_date}",
                    route_date=target_date,
                    driver_id=1,  # Assign to default driver (should be improved)
                    vehicle="Van-001",  # Default vehicle
                    start_location="Main Warehouse",
                    end_location="Main Warehouse",
                    planned_start_time="09:00",
                    planned_end_time="17:00",
                    status=DeliveryRoute.Status.PLANNED
                )
                
                # Add documents to route
                for doc in docs:
                    if isinstance(doc, DeliveryDocument):
                        route.delivery_documents.add(doc)
                        doc.status = DeliveryDocument.Status.SCHEDULED
                    else:  # ReturnDocument
                        route.return_documents.add(doc)
                        doc.status = ReturnDocument.Status.SCHEDULED
                    
                    doc.save()
                    scheduled_count += 1
        
        logger.info(f"Auto-scheduled {scheduled_count} deliveries for {date_str}")
        return {'scheduled_count': scheduled_count, 'message': 'Auto-scheduling completed'}
        
    except Exception as e:
        logger.error(f"Error in auto-scheduling for {date_str}: {str(e)}")
        return {'scheduled_count': 0, 'message': f'Error: {str(e)}'}

@shared_task
def schedule_return_reminder(return_document_id):
    """
    Send reminder for upcoming return
    """
    try:
        return_doc = ReturnDocument.objects.get(id=return_document_id)
        
        # Send email/SMS reminder (implement your notification service)
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=return_doc.reservation.order.customer,
            title="Return Reminder",
            message=f"Your rental items are due for return on {return_doc.due_datetime.date()}. "
                   f"Please have items ready for pickup.",
            notification_type='return_reminder'
        )
        
        logger.info(f"Return reminder sent for document {return_document_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending return reminder for {return_document_id}: {str(e)}")
        return False

@shared_task
def process_delivery_completion(delivery_document_id):
    """
    Process completion of delivery/pickup - update stock movements
    """
    try:
        with transaction.atomic():
            delivery = DeliveryDocument.objects.get(id=delivery_document_id)
            
            if delivery.document_type == DeliveryDocument.DocumentType.PICKUP:
                # Items have been picked up by customer
                for item in delivery.items.all():
                    # Create stock movement from reserved to with customer
                    StockMovement.objects.create(
                        delivery_document=delivery,
                        movement_type=StockMovement.MovementType.PICKUP,
                        product=item.product,
                        quantity=-item.quantity_delivered,
                        from_location="Reserved",
                        to_location="With Customer",
                        reason=f"Delivered to customer - {delivery.document_number}"
                    )
                    
                    # Update product stock
                    item.product.stock_reserved -= item.quantity_delivered
                    item.product.stock_rented += item.quantity_delivered
                    item.product.save()
            
            # Update delivery status
            delivery.status = DeliveryDocument.Status.DELIVERED
            delivery.completed_at = timezone.now()
            delivery.save()
            
            logger.info(f"Delivery completion processed for {delivery_document_id}")
            return True
            
    except Exception as e:
        logger.error(f"Error processing delivery completion for {delivery_document_id}: {str(e)}")
        return False

@shared_task
def process_return_completion(return_document_id):
    """
    Process completion of return - update stock movements and availability
    """
    try:
        with transaction.atomic():
            return_doc = ReturnDocument.objects.get(id=return_document_id)
            
            for item in return_doc.items.all():
                # Create stock movement from customer back to available
                StockMovement.objects.create(
                    return_document=return_doc,
                    movement_type=StockMovement.MovementType.RETURN,
                    product=item.product,
                    quantity=item.quantity_returned,
                    from_location="With Customer",
                    to_location="Available Stock",
                    reason=f"Returned by customer - {return_doc.document_number}"
                )
                
                # Update product stock
                item.product.stock_rented -= item.quantity_returned
                item.product.stock_available += item.quantity_returned
                
                # Handle damaged/missing items
                if item.quantity_damaged > 0:
                    item.product.stock_damaged += item.quantity_damaged
                    StockMovement.objects.create(
                        return_document=return_doc,
                        movement_type=StockMovement.MovementType.DAMAGE,
                        product=item.product,
                        quantity=item.quantity_damaged,
                        from_location="With Customer",
                        to_location="Damaged Stock",
                        reason=f"Damaged items - {return_doc.document_number}",
                        cost_impact=item.damage_cost
                    )
                
                if item.quantity_missing > 0:
                    StockMovement.objects.create(
                        return_document=return_doc,
                        movement_type=StockMovement.MovementType.LOSS,
                        product=item.product,
                        quantity=item.quantity_missing,
                        from_location="With Customer",
                        to_location="Lost",
                        reason=f"Missing items - {return_doc.document_number}",
                        cost_impact=item.replacement_cost
                    )
                
                item.product.save()
            
            # Update return status
            return_doc.status = ReturnDocument.Status.COMPLETED
            return_doc.completed_at = timezone.now()
            return_doc.save()
            
            logger.info(f"Return completion processed for {return_document_id}")
            return True
            
    except Exception as e:
        logger.error(f"Error processing return completion for {return_document_id}: {str(e)}")
        return False

@shared_task
def check_overdue_returns():
    """
    Daily task to check for overdue returns and take action
    """
    try:
        overdue_returns = ReturnDocument.objects.filter(
            due_datetime__lt=timezone.now(),
            status__in=[ReturnDocument.Status.PENDING, ReturnDocument.Status.SCHEDULED]
        )
        
        for return_doc in overdue_returns:
            # Update status to overdue
            return_doc.status = ReturnDocument.Status.OVERDUE
            return_doc.save()
            
            # Calculate and apply late fees
            days_overdue = return_doc.days_overdue
            late_fee = calculate_late_fee(return_doc, days_overdue)
            return_doc.late_fee_applied = late_fee
            return_doc.save()
            
            # Send overdue notification
            from apps.notifications.models import Notification
            Notification.objects.create(
                user=return_doc.reservation.order.customer,
                title="Overdue Return",
                message=f"Your rental return is {days_overdue} days overdue. "
                       f"Late fee of ${late_fee} has been applied.",
                notification_type='overdue_return'
            )
        
        logger.info(f"Processed {overdue_returns.count()} overdue returns")
        return overdue_returns.count()
        
    except Exception as e:
        logger.error(f"Error checking overdue returns: {str(e)}")
        return 0

def extract_postal_code(address):
    """Extract postal code from address string"""
    import re
    # Simple regex for US postal codes
    match = re.search(r'\b\d{5}(-\d{4})?\b', address)
    return match.group() if match else "00000"

def calculate_late_fee(return_doc, days_overdue):
    """Calculate late fee based on days overdue"""
    # Simple calculation: $5 per day per item
    total_items = sum(item.quantity_due for item in return_doc.items.all())
    return days_overdue * total_items * 5.00

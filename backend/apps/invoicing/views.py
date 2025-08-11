from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Sum, Avg, Count
from django.http import HttpResponse
from datetime import datetime, date, timedelta
from decimal import Decimal
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from .models import (
    Invoice, InvoiceLine, InvoiceTemplate, PaymentTerm,
    CreditNote, TaxRate
)
from .serializers import (
    InvoiceSerializer, InvoiceCreateSerializer, CreditNoteSerializer,
    InvoiceTemplateSerializer, PaymentTermSerializer, TaxRateSerializer,
    InvoiceStatsSerializer, BulkInvoiceActionSerializer, InvoicePaymentSerializer
)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('customer', 'order', 'payment_term').prefetch_related('lines__product')
        
        # Filter for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)
        
        # Filtering
        invoice_status = self.request.query_params.get('status')
        order_id = self.request.query_params.get('order_id')
        customer_id = self.request.query_params.get('customer_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if invoice_status in [choice[0] for choice in Invoice.Status.choices]:
            queryset = queryset.filter(status=invoice_status)
        
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from).date()
                queryset = queryset.filter(issue_date__gte=from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to).date()
                queryset = queryset.filter(issue_date__lte=to_date)
            except ValueError:
                pass
        
        return queryset.order_by('-issue_date')
    
    def list(self, request):
        """Get invoices with pagination"""
        queryset = self.get_queryset()
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        limit = min(int(request.query_params.get('limit', 20)), 100)
        offset = (page - 1) * limit
        
        total = queryset.count()
        invoices_page = queryset[offset:offset + limit]
        
        serializer = self.get_serializer(invoices_page, many=True)
        
        return Response({
            'success': True,
            'data': {
                'invoices': serializer.data,
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
    
    def create(self, request):
        """Create invoice for order (Admin only)"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            invoice = serializer.save()
            
            return Response({
                'success': True,
                'message': 'Invoice created successfully',
                'data': InvoiceSerializer(invoice).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid data',
                'details': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Download invoice PDF"""
        invoice = self.get_object()
        
        # Create PDF
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "INVOICE")
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 80, f"Invoice Number: {invoice.invoice_number}")
        p.drawString(50, height - 100, f"Date: {invoice.issue_date}")
        p.drawString(50, height - 120, f"Due Date: {invoice.due_date}")
        
        # Customer details
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, height - 160, "Bill To:")
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 180, f"{invoice.customer.get_full_name()}")
        if hasattr(invoice.customer, 'profile'):
            p.drawString(50, height - 200, f"{invoice.customer.profile.address}")
        
        # Invoice lines
        y_position = height - 250
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y_position, "Description")
        p.drawString(300, y_position, "Qty")
        p.drawString(350, y_position, "Rate")
        p.drawString(400, y_position, "Amount")
        
        y_position -= 20
        p.setFont("Helvetica", 10)
        for line in invoice.lines.all():
            p.drawString(50, y_position, line.description or line.product.name if line.product else "")
            p.drawString(300, y_position, str(line.quantity))
            p.drawString(350, y_position, f"{line.unit_price}")
            line_total = line.quantity * line.unit_price - line.discount_amount + line.tax_amount
            p.drawString(400, y_position, f"{line_total}")
            y_position -= 20
        
        # Totals
        y_position -= 20
        p.setFont("Helvetica-Bold", 10)
        p.drawString(300, y_position, f"Subtotal: {invoice.subtotal}")
        y_position -= 15
        p.drawString(300, y_position, f"Tax: {invoice.tax_amount}")
        y_position -= 15
        p.drawString(300, y_position, f"Total: {invoice.total_amount}")
        
        p.showPage()
        p.save()
        
        # Return PDF response
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
        return response
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send invoice via email (Admin only)"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoice = self.get_object()
        
        if invoice.status == Invoice.Status.DRAFT:
            invoice.status = Invoice.Status.SENT
            invoice.save()
        
        # Here you would implement email sending logic
        # For now, just return success
        
        return Response({
            'success': True,
            'message': 'Invoice sent successfully'
        })
    
    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        """Record payment for invoice"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        invoice = self.get_object()
        serializer = InvoicePaymentSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid payment data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        payment_amount = data['amount']
        
        # Update invoice paid amount
        invoice.paid_amount += payment_amount
        
        # Update status based on payment
        if invoice.paid_amount >= invoice.total_amount:
            invoice.status = Invoice.Status.PAID
        elif invoice.paid_amount > 0:
            invoice.status = Invoice.Status.PARTIALLY_PAID
        
        invoice.save()
        
        # Create payment record (you might want to create a Payment model)
        # Payment.objects.create(...)
        
        return Response({
            'success': True,
            'message': 'Payment recorded successfully',
            'data': {
                'paid_amount': float(invoice.paid_amount),
                'remaining_amount': float(invoice.total_amount - invoice.paid_amount),
                'status': invoice.status
            }
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get invoice statistics (Admin only)"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Date filtering
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = Invoice.objects.all()
        
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from).date()
                queryset = queryset.filter(issue_date__gte=from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to).date()
                queryset = queryset.filter(issue_date__lte=to_date)
            except ValueError:
                pass
        
        # Calculate stats
        stats = queryset.aggregate(
            total_invoices=Count('id'),
            total_amount=Sum('total_amount'),
            paid_amount=Sum('paid_amount')
        )
        
        stats['pending_amount'] = (stats['total_amount'] or 0) - (stats['paid_amount'] or 0)
        
        # Overdue amount
        overdue_invoices = queryset.filter(
            due_date__lt=timezone.now().date(),
            status__in=[Invoice.Status.SENT, Invoice.Status.PARTIALLY_PAID]
        )
        stats['overdue_amount'] = overdue_invoices.aggregate(
            amount=Sum('total_amount')
        )['amount'] or 0
        
        # Average payment days (based on invoice due dates and issue dates)
        paid_invoices = queryset.filter(status=Invoice.Status.PAID)
        if paid_invoices.exists():
            # Calculate average days between issue and due date for paid invoices
            # This gives an estimate since we don't track actual payment dates
            total_days = 0
            count = 0
            for invoice in paid_invoices:
                if invoice.due_date and invoice.issue_date:
                    days_diff = (invoice.due_date - invoice.issue_date).days
                    total_days += days_diff
                    count += 1
            
            if count > 0:
                stats['average_payment_days'] = round(total_days / count, 1)
            else:
                stats['average_payment_days'] = 30.0  # Default assumption
        else:
            stats['average_payment_days'] = 0.0
        
        serializer = InvoiceStatsSerializer(stats)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Bulk actions on invoices (Admin only)"""
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': {
                    'code': 'PERMISSION_DENIED',
                    'message': 'Admin access required'
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BulkInvoiceActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid data',
                    'details': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        invoices = Invoice.objects.filter(id__in=data['invoice_ids'])
        
        if data['action'] == 'send':
            invoices.filter(status=Invoice.Status.DRAFT).update(status=Invoice.Status.SENT)
            message = f"Sent {invoices.count()} invoices"
        
        elif data['action'] == 'mark_paid':
            for invoice in invoices:
                invoice.paid_amount = invoice.total_amount
                invoice.status = Invoice.Status.PAID
                invoice.save()
            message = f"Marked {invoices.count()} invoices as paid"
        
        elif data['action'] == 'cancel':
            invoices.update(status=Invoice.Status.CANCELLED)
            message = f"Cancelled {invoices.count()} invoices"
        
        return Response({
            'success': True,
            'message': message
        })


class CreditNoteViewSet(viewsets.ModelViewSet):
    queryset = CreditNote.objects.all()
    serializer_class = CreditNoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().select_related('invoice', 'invoice__customer')
        
        # Filter for non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(invoice__customer=self.request.user)
        
        return queryset.order_by('-created_at')


class PaymentTermViewSet(viewsets.ModelViewSet):
    queryset = PaymentTerm.objects.all()
    serializer_class = PaymentTermSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True).order_by('days')


class TaxRateViewSet(viewsets.ModelViewSet):
    queryset = TaxRate.objects.all()
    serializer_class = TaxRateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().filter(is_active=True)
        
        country = self.request.query_params.get('country')
        state = self.request.query_params.get('state')
        
        if country:
            queryset = queryset.filter(country=country)
        
        if state:
            queryset = queryset.filter(state=state)
        
        return queryset.order_by('name')


class InvoiceTemplateViewSet(viewsets.ModelViewSet):
    queryset = InvoiceTemplate.objects.all()
    serializer_class = InvoiceTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_staff:
            return InvoiceTemplate.objects.none()
        
        return super().get_queryset().filter(is_active=True).order_by('name')
# Full implementation will be added when serializers are created

@api_view(['GET'])
def invoicing_overview(request):
    """Get invoicing overview statistics"""
    return Response({
        'status': 'success',
        'message': 'Invoicing app is working',
        'data': {
            'total_invoices': 0,
            'pending_invoices': 0,
            'paid_invoices': 0,
            'overdue_invoices': 0
        }
    })

from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import (
    Invoice, InvoiceLine, InvoiceTemplate, PaymentTerm,
    CreditNote, TaxRate
)
from apps.orders.serializers import RentalOrderSerializer

User = get_user_model()


class TaxRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxRate
        fields = [
            'id', 'name', 'rate', 'country', 'state', 'tax_type',
            'description', 'is_active', 'effective_from', 'effective_to',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTerm
        fields = [
            'id', 'name', 'days', 'discount_percent', 'description',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    line_total = serializers.SerializerMethodField()
    
    class Meta:
        model = InvoiceLine
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'description',
            'quantity', 'unit_price', 'discount_percent', 'discount_amount',
            'tax_rate', 'tax_amount', 'line_total', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_line_total(self, obj):
        return obj.quantity * obj.unit_price - obj.discount_amount + obj.tax_amount


class InvoiceSerializer(serializers.ModelSerializer):
    lines = InvoiceLineSerializer(many=True, read_only=True)
    order = RentalOrderSerializer(read_only=True)
    order_id = serializers.UUIDField(write_only=True, required=False)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    payment_term_name = serializers.CharField(source='payment_term.name', read_only=True)
    total_amount_due = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'order', 'order_id', 'customer',
            'customer_name', 'invoice_type', 'status', 'issue_date',
            'due_date', 'payment_term', 'payment_term_name', 'subtotal',
            'discount_amount', 'tax_amount', 'total_amount', 'paid_amount',
            'total_amount_due', 'currency', 'notes', 'terms_conditions',
            'is_overdue', 'created_at', 'updated_at', 'lines'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'paid_amount', 'created_at', 'updated_at'
        ]
    
    def get_total_amount_due(self, obj):
        return obj.total_amount - obj.paid_amount
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        return obj.due_date < timezone.now().date() and obj.status != Invoice.Status.PAID


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invoices"""
    lines = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Invoice
        fields = [
            'order', 'customer', 'invoice_type', 'issue_date', 'due_date',
            'payment_term', 'notes', 'terms_conditions', 'lines'
        ]
    
    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        invoice = Invoice.objects.create(**validated_data)
        
        # Create invoice lines
        total_subtotal = Decimal('0.00')
        total_tax = Decimal('0.00')
        
        for line_data in lines_data:
            line = InvoiceLine.objects.create(
                invoice=invoice,
                product_id=line_data.get('product_id'),
                description=line_data.get('description', ''),
                quantity=Decimal(line_data.get('quantity', 1)),
                unit_price=Decimal(line_data.get('unit_price', 0)),
                discount_percent=Decimal(line_data.get('discount_percent', 0)),
                discount_amount=Decimal(line_data.get('discount_amount', 0)),
                tax_rate=Decimal(line_data.get('tax_rate', 0))
            )
            
            # Calculate tax amount
            line_subtotal = line.quantity * line.unit_price - line.discount_amount
            line.tax_amount = line_subtotal * (line.tax_rate / 100)
            line.save()
            
            total_subtotal += line_subtotal
            total_tax += line.tax_amount
        
        # Update invoice totals
        invoice.subtotal = total_subtotal
        invoice.tax_amount = total_tax
        invoice.total_amount = total_subtotal + total_tax - invoice.discount_amount
        invoice.save()
        
        return invoice


class CreditNoteSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    customer_name = serializers.CharField(source='invoice.customer.get_full_name', read_only=True)
    
    class Meta:
        model = CreditNote
        fields = [
            'id', 'credit_note_number', 'invoice', 'invoice_number',
            'customer_name', 'reason', 'amount', 'currency', 'status',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'credit_note_number', 'created_at', 'updated_at']


class InvoiceTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceTemplate
        fields = [
            'id', 'name', 'template_type', 'subject', 'content',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceStatsSerializer(serializers.Serializer):
    """Serializer for invoice statistics"""
    total_invoices = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    overdue_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_payment_days = serializers.FloatField()


class BulkInvoiceActionSerializer(serializers.Serializer):
    """Serializer for bulk invoice actions"""
    invoice_ids = serializers.ListField(child=serializers.UUIDField())
    action = serializers.ChoiceField(choices=['send', 'mark_paid', 'cancel'])
    payment_date = serializers.DateField(required=False)
    payment_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class InvoicePaymentSerializer(serializers.Serializer):
    """Serializer for invoice payment recording"""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_date = serializers.DateField()
    payment_method = serializers.CharField()
    reference_number = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

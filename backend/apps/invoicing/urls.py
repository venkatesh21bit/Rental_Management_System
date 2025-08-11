from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'invoices', views.InvoiceViewSet, basename='invoice')
router.register(r'credit-notes', views.CreditNoteViewSet, basename='creditnote')
router.register(r'payment-terms', views.PaymentTermViewSet, basename='paymentterm')
router.register(r'tax-rates', views.TaxRateViewSet, basename='taxrate')
router.register(r'templates', views.InvoiceTemplateViewSet, basename='invoicetemplate')

app_name = 'invoicing'

urlpatterns = [
    path('', include(router.urls)),
]

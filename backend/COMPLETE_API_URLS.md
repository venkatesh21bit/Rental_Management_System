# Complete API URL Listing for Rental Management System

## Base URL Structure
All APIs are prefixed with `/api/`

## Authentication APIs
**Base Path:** `/api/auth/`

| Method | URL | Description | View Function |
|--------|-----|-------------|---------------|
| POST | `/api/auth/register/` | Register new customer account | `accounts.views.register` |
| POST | `/api/auth/login/` | Authenticate user with email and password | `accounts.views.login_view` |
| POST | `/api/auth/logout/` | Logout user and invalidate tokens | `accounts.views.logout_view` |
| POST | `/api/auth/refresh/` | Refresh access token | `accounts.views.refresh_token` |
| POST | `/api/auth/forgot-password/` | Send password reset email | `accounts.views.forgot_password` |
| POST | `/api/auth/reset-password/` | Reset password with token | `accounts.views.reset_password` |

## User Management APIs
**Base Path:** `/api/accounts/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/accounts/profile/` | List user profiles (admin) | `UserProfileViewSet.list` |
| GET | `/api/accounts/profile/me/` | Get current user profile | `UserProfileViewSet.me` |
| PUT | `/api/accounts/profile/update_profile/` | Update current user profile | `UserProfileViewSet.update_profile` |
| POST | `/api/accounts/profile/change_password/` | Change user password | `UserProfileViewSet.change_password` |
| GET | `/api/accounts/profile/stats/` | Get customer statistics | `UserProfileViewSet.stats` |
| GET | `/api/accounts/profile/orders/` | Get customer order history | `UserProfileViewSet.orders` |
| GET | `/api/accounts/customers/` | Get all customers (admin) | `CustomerViewSet.list` |
| GET | `/api/accounts/customers/{id}/` | Get customer details | `CustomerViewSet.retrieve` |
| GET | `/api/accounts/customers/{id}/stats/` | Get customer statistics | `CustomerViewSet.stats` |
| GET/POST | `/api/accounts/customer-groups/` | Manage customer groups | `CustomerGroupViewSet` |

## Product Management APIs
**Base Path:** `/api/catalog/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/catalog/products/` | Get all products with filtering | `ProductViewSet.list` |
| GET | `/api/catalog/products/{id}/` | Get single product details | `ProductViewSet.retrieve` |
| POST | `/api/catalog/products/` | Create new product (admin) | `ProductViewSet.create` |
| PUT | `/api/catalog/products/{id}/` | Update product (admin) | `ProductViewSet.update` |
| DELETE | `/api/catalog/products/{id}/` | Delete product (admin) | `ProductViewSet.destroy` |
| GET | `/api/catalog/products/{id}/availability/` | Check product availability | `ProductViewSet.availability` |
| GET | `/api/catalog/products/categories/` | Get all product categories | `ProductViewSet.categories` |
| POST | `/api/catalog/products/bulk_update/` | Bulk update products | `ProductViewSet.bulk_update` |
| GET/POST | `/api/catalog/categories/` | Manage product categories | `ProductCategoryViewSet` |
| GET | `/api/catalog/categories/tree/` | Get complete category tree | `ProductCategoryViewSet.tree` |
| GET | `/api/catalog/categories/{id}/products/` | Get products in category | `ProductCategoryViewSet.products` |
| GET/POST | `/api/catalog/product-images/` | Manage product images | `ProductImageViewSet` |
| GET/POST | `/api/catalog/product-items/` | Manage product items | `ProductItemViewSet` |
| GET | `/api/catalog/product-items/available/` | Get available items | `ProductItemViewSet.available` |
| POST | `/api/catalog/product-items/{id}/update_status/` | Update item status | `ProductItemViewSet.update_status` |

## Inventory Management APIs
**Base Path:** `/api/catalog/inventory/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/catalog/inventory/` | Get inventory status (admin) | `InventoryViewSet.list` |
| PUT | `/api/catalog/inventory/update_status/` | Update inventory status | `InventoryViewSet.update_status` |
| GET | `/api/catalog/inventory/alerts/` | Get low stock alerts | `InventoryViewSet.alerts` |

## Quotation APIs
**Base Path:** `/api/orders/quotes/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/orders/quotes/` | Get customer quotations | `RentalQuoteViewSet.list` |
| POST | `/api/orders/quotes/` | Create rental quotation | `RentalQuoteViewSet.create` |
| GET | `/api/orders/quotes/{id}/` | Get quotation details | `RentalQuoteViewSet.retrieve` |
| PUT | `/api/orders/quotes/{id}/` | Update quotation | `RentalQuoteViewSet.update` |
| DELETE | `/api/orders/quotes/{id}/` | Delete quotation | `RentalQuoteViewSet.destroy` |
| POST | `/api/orders/quotes/{id}/convert_to_order/` | Convert to rental order | `RentalQuoteViewSet.convert_to_order` |
| POST | `/api/orders/quotes/{id}/send_quote/` | Send quotation via email | `RentalQuoteViewSet.send_quote` |
| GET | `/api/orders/quotes/calculate_pricing/` | Calculate pricing | `RentalQuoteViewSet.calculate_pricing` |

## Rental Order APIs
**Base Path:** `/api/orders/orders/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/orders/orders/` | Get rental orders | `RentalOrderViewSet.list` |
| POST | `/api/orders/orders/` | Create rental order | `RentalOrderViewSet.create` |
| GET | `/api/orders/orders/{id}/` | Get order details | `RentalOrderViewSet.retrieve` |
| PUT | `/api/orders/orders/{id}/` | Update order | `RentalOrderViewSet.update` |
| POST | `/api/orders/orders/{id}/confirm_pickup/` | Mark order as picked up | `RentalOrderViewSet.confirm_pickup` |
| POST | `/api/orders/orders/{id}/confirm_return/` | Process order return | `RentalOrderViewSet.confirm_return` |
| GET | `/api/orders/orders/{id}/check_availability/` | Check availability | `RentalOrderViewSet.check_availability` |
| GET | `/api/orders/orders/overdue_orders/` | Get overdue orders | `RentalOrderViewSet.overdue_orders` |

## Availability APIs
**Base Path:** `/api/orders/availability/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| POST | `/api/orders/availability/check/` | Check availability | `AvailabilityViewSet.check` |
| POST | `/api/orders/availability/batch_check/` | Batch availability check | `AvailabilityViewSet.batch_check` |
| GET | `/api/orders/availability/calendar/` | Get availability calendar | `AvailabilityViewSet.calendar` |
| POST | `/api/orders/availability/alternatives/` | Find alternative dates | `AvailabilityViewSet.alternatives` |

## Reservation APIs
**Base Path:** `/api/orders/reservations/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/orders/reservations/` | Get reservations | `ReservationViewSet.list` |
| GET | `/api/orders/reservations/{id}/` | Get reservation details | `ReservationViewSet.retrieve` |
| GET | `/api/orders/reservations/upcoming_returns/` | Get upcoming returns | `ReservationViewSet.upcoming_returns` |

## Contract APIs
**Base Path:** `/api/orders/contracts/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/orders/contracts/` | Get rental contracts | `RentalContractViewSet.list` |
| GET | `/api/orders/contracts/{id}/` | Get contract details | `RentalContractViewSet.retrieve` |
| POST | `/api/orders/contracts/{id}/sign_contract/` | Sign rental contract | `RentalContractViewSet.sign_contract` |

## Pricing APIs
**Base Path:** `/api/pricing/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/pricing/calculate/` | Calculate pricing | `PricingViewSet.calculate` |
| POST | `/api/pricing/batch_calculate/` | Batch pricing calculation | `PricingViewSet.batch_calculate` |
| POST | `/api/pricing/calculate_late_fee/` | Calculate late fees | `PricingViewSet.calculate_late_fee` |
| GET | `/api/pricing/customer_discounts/` | Get customer discounts | `PricingViewSet.customer_discounts` |
| GET/POST | `/api/pricing/pricelists/` | Manage price lists | `PriceListViewSet` |
| POST | `/api/pricing/pricelists/{id}/add_items/` | Add items to price list | `PriceListViewSet.add_items` |
| POST | `/api/pricing/pricelists/{id}/bulk_update_prices/` | Bulk update prices | `PriceListViewSet.bulk_update_prices` |
| GET/POST | `/api/pricing/pricing-rules/` | Manage pricing rules | `PricingRuleViewSet` |
| GET/POST | `/api/pricing/seasonal-pricing/` | Manage seasonal pricing | `SeasonalPricingViewSet` |
| GET/POST | `/api/pricing/volume-discounts/` | Manage volume discounts | `VolumeDiscountViewSet` |
| GET/POST | `/api/pricing/loyalty-discounts/` | Manage loyalty discounts | `LoyaltyDiscountViewSet` |
| GET/POST | `/api/pricing/late-fees/` | Manage late fees | `LateFeeViewSet` |

## Payment APIs
**Base Path:** `/api/payments/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/payments/` | Get payment history | `PaymentViewSet.list` |
| POST | `/api/payments/intent/` | Create payment intent | `PaymentViewSet.create_intent` |
| POST | `/api/payments/confirm/` | Confirm payment | `PaymentViewSet.confirm_payment` |
| POST | `/api/payments/refund/` | Process refund (admin) | `PaymentViewSet.process_refund` |
| GET/POST | `/api/payments/providers/` | Manage payment providers | `PaymentProviderViewSet` |
| GET/POST | `/api/payments/links/` | Manage payment links | `PaymentLinkViewSet` |
| GET/POST | `/api/payments/bank-accounts/` | Manage bank accounts | `BankAccountViewSet` |
| GET | `/api/payments/webhooks/` | Get webhook events | `WebhookEventViewSet.list` |

## Invoice APIs
**Base Path:** `/api/invoicing/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/invoicing/invoices/` | Get invoices | `InvoiceViewSet.list` |
| POST | `/api/invoicing/invoices/` | Create invoice (admin) | `InvoiceViewSet.create` |
| GET | `/api/invoicing/invoices/{id}/` | Get invoice details | `InvoiceViewSet.retrieve` |
| GET | `/api/invoicing/invoices/{id}/pdf/` | Download invoice PDF | `InvoiceViewSet.pdf` |
| POST | `/api/invoicing/invoices/{id}/send/` | Send invoice via email | `InvoiceViewSet.send` |
| POST | `/api/invoicing/invoices/{id}/record_payment/` | Record payment | `InvoiceViewSet.record_payment` |
| GET | `/api/invoicing/invoices/stats/` | Get invoice statistics | `InvoiceViewSet.stats` |
| POST | `/api/invoicing/invoices/bulk_action/` | Bulk invoice actions | `InvoiceViewSet.bulk_action` |
| GET/POST | `/api/invoicing/credit-notes/` | Manage credit notes | `CreditNoteViewSet` |
| GET/POST | `/api/invoicing/payment-terms/` | Manage payment terms | `PaymentTermViewSet` |
| GET/POST | `/api/invoicing/tax-rates/` | Manage tax rates | `TaxRateViewSet` |
| GET/POST | `/api/invoicing/templates/` | Manage invoice templates | `InvoiceTemplateViewSet` |

## Delivery Management APIs
**Base Path:** `/api/deliveries/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/deliveries/deliveries/` | Get delivery schedules | `DeliveryDocumentViewSet.list` |
| POST | `/api/deliveries/deliveries/schedule/` | Schedule delivery | `DeliveryDocumentViewSet.schedule` |
| PUT | `/api/deliveries/deliveries/{id}/update_status/` | Update delivery status | `DeliveryDocumentViewSet.update_status` |
| GET | `/api/deliveries/deliveries/schedule_for_date/` | Get schedule for date | `DeliveryDocumentViewSet.schedule_for_date` |
| GET/POST | `/api/deliveries/returns/` | Manage return documents | `ReturnDocumentViewSet` |
| POST | `/api/deliveries/returns/process_return/` | Process return | `ReturnDocumentViewSet.process_return` |
| GET | `/api/deliveries/stock-movements/` | Get stock movements | `StockMovementViewSet.list` |
| GET/POST | `/api/deliveries/routes/` | Manage delivery routes | `DeliveryRouteViewSet` |
| POST | `/api/deliveries/routes/{id}/start_route/` | Start delivery route | `DeliveryRouteViewSet.start_route` |
| POST | `/api/deliveries/routes/{id}/complete_route/` | Complete route | `DeliveryRouteViewSet.complete_route` |

## Notification APIs
**Base Path:** `/api/notifications/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/notifications/` | Get user notifications | `NotificationViewSet.list` |
| PUT | `/api/notifications/{id}/read/` | Mark notification as read | `NotificationViewSet.mark_read` |
| PUT | `/api/notifications/read-all/` | Mark all as read | `NotificationViewSet.mark_all_read` |
| POST | `/api/notifications/settings/` | Update notification settings | `NotificationViewSet.update_settings` |
| GET/POST | `/api/notifications/templates/` | Manage notification templates | `NotificationTemplateViewSet` |
| GET/POST | `/api/notifications/providers/` | Manage notification providers | `NotificationProviderViewSet` |

## Reports APIs
**Base Path:** `/api/reports/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/reports/rental-summary/` | Rental summary report | `ReportsViewSet.rental_summary` |
| GET | `/api/reports/revenue/` | Revenue report | `ReportsViewSet.revenue` |
| GET | `/api/reports/customer-activity/` | Customer activity report | `ReportsViewSet.customer_activity` |
| GET | `/api/reports/product-performance/` | Product performance report | `ReportsViewSet.product_performance` |
| GET | `/api/reports/late-returns/` | Late returns report | `ReportsViewSet.late_returns` |
| GET/POST | `/api/reports/templates/` | Manage report templates | `ReportTemplateViewSet` |
| GET/POST | `/api/reports/scheduled/` | Manage scheduled reports | `ScheduledReportViewSet` |

## Dashboard & Analytics APIs
**Base Path:** `/api/dashboard/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/dashboard/stats/` | Get dashboard statistics | `DashboardViewSet.stats` |
| GET | `/api/dashboard/revenue/` | Get revenue analytics | `DashboardViewSet.revenue` |
| GET | `/api/dashboard/products/popular/` | Get popular products | `DashboardViewSet.popular_products` |
| GET | `/api/dashboard/customers/top/` | Get top customers | `DashboardViewSet.top_customers` |
| GET/POST | `/api/dashboard/widgets/` | Manage dashboard widgets | `DashboardWidgetViewSet` |

## File Upload APIs
**Base Path:** `/api/upload/`

| Method | URL | Description | View Function |
|--------|-----|-------------|---------------|
| POST | `/api/upload/product-image/` | Upload product image | `upload_views.upload_product_image` |
| POST | `/api/upload/documents/` | Upload documents | `upload_views.upload_documents` |

## Webhook APIs
**Base Path:** `/api/webhooks/`

| Method | URL | Description | View Function |
|--------|-----|-------------|---------------|
| POST | `/api/webhooks/stripe/` | Stripe payment webhook | `webhook_views.stripe_webhook` |
| POST | `/api/webhooks/razorpay/` | Razorpay payment webhook | `webhook_views.razorpay_webhook` |
| POST | `/api/webhooks/paypal/` | PayPal payment webhook | `webhook_views.paypal_webhook` |

## System Configuration APIs
**Base Path:** `/api/config/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET | `/api/config/system/` | Get system configuration | `SystemConfigViewSet.retrieve` |
| PUT | `/api/config/system/` | Update system configuration | `SystemConfigViewSet.update` |
| GET | `/api/config/payment-gateways/` | Get payment gateway settings | `PaymentGatewayConfigViewSet.list` |
| PUT | `/api/config/payment-gateways/` | Update payment gateways | `PaymentGatewayConfigViewSet.update` |

## API Management APIs
**Base Path:** `/api/api/`

| Method | URL | Description | ViewSet |
|--------|-----|-------------|---------|
| GET/POST | `/api/api/keys/` | Manage API keys | `APIKeyViewSet` |
| GET | `/api/api/requests/` | Get API request logs | `APIRequestViewSet.list` |
| GET/POST | `/api/api/webhooks/` | Manage webhook endpoints | `WebhookEndpointViewSet` |
| GET | `/api/api/integrations/` | Manage external integrations | `ExternalIntegrationViewSet.list` |

## Error Response Format
All APIs follow consistent error response format:
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "any?"
  }
}
```

## Authentication
Most APIs require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting
- Public APIs: 100 requests per minute
- Authenticated APIs: 1000 requests per minute  
- Admin APIs: 5000 requests per minute

## Pagination
List APIs support pagination with query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

## Total API Endpoints: 150+

This comprehensive API system covers all aspects of the rental management system including authentication, product management, ordering, pricing, payments, invoicing, delivery management, notifications, reporting, and system administration.

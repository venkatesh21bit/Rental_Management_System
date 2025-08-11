# Rental Management System - API Documentation

## Authentication APIs

### POST /api/auth/login
- **Description**: Authenticate user with email and password
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string",
        "address": "Address",
        "customerType": "individual | corporate",
        "pricelistId": "string?",
        "totalRentals": "number",
        "totalSpent": "number"
      },
      "token": "string",
      "refreshToken": "string"
    }
  }
  ```

### POST /api/auth/register
- **Description**: Register new customer account
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "password": "string",
    "phone": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "postalCode": "string",
      "country": "string"
    },
    "customerType": "individual | corporate"
  }
  ```

### POST /api/auth/logout
- **Description**: Logout user and invalidate tokens
- **Headers**: `Authorization: Bearer <token>`

### POST /api/auth/refresh
- **Description**: Refresh access token
- **Request Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```

### POST /api/auth/forgot-password
- **Description**: Send password reset email
- **Request Body**:
  ```json
  {
    "email": "string"
  }
  ```

### POST /api/auth/reset-password
- **Description**: Reset password with token
- **Request Body**:
  ```json
  {
    "token": "string",
    "newPassword": "string"
  }
  ```

## Product Management APIs

### GET /api/products
- **Description**: Get all rental products with filtering and pagination
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
  - `category`: string
  - `search`: string
  - `isRentable`: boolean
  - `availability`: boolean
  - `sortBy`: "name" | "price" | "category" | "createdAt"
  - `sortOrder`: "asc" | "desc"
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "products": "Product[]",
      "total": "number",
      "page": "number",
      "totalPages": "number"
    }
  }
  ```

### GET /api/products/:id
- **Description**: Get single product details
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "product": "Product",
      "availability": {
        "isAvailable": "boolean",
        "nextAvailableDate": "Date?",
        "unavailableDates": "Date[]"
      }
    }
  }
  ```

### POST /api/products
- **Description**: Create new rental product (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "category": "string",
    "image": "string",
    "isRentable": "boolean",
    "basePrice": "number",
    "unit": "hour | day | week | month",
    "specifications": "Record<string, string>?"
  }
  ```

### PUT /api/products/:id
- **Description**: Update product details (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`

### DELETE /api/products/:id
- **Description**: Delete product (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`

### GET /api/products/:id/availability
- **Description**: Check product availability for specific date range
- **Query Parameters**:
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `quantity`: number (default: 1)

### GET /api/products/categories
- **Description**: Get all product categories
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "categories": ["string"]
    }
  }
  ```

## Quotation APIs

### GET /api/quotations
- **Description**: Get customer quotations
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: number
  - `limit`: number
  - `status`: "draft" | "sent" | "confirmed" | "cancelled"

### POST /api/quotations
- **Description**: Create rental quotation
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "items": [
      {
        "productId": "string",
        "quantity": "number",
        "duration": {
          "value": "number",
          "unit": "hour | day | week | month"
        }
      }
    ],
    "startDate": "Date",
    "endDate": "Date",
    "validUntil": "Date?"
  }
  ```

### GET /api/quotations/:id
- **Description**: Get quotation details
- **Headers**: `Authorization: Bearer <token>`

### PUT /api/quotations/:id
- **Description**: Update quotation
- **Headers**: `Authorization: Bearer <token>`

### POST /api/quotations/:id/confirm
- **Description**: Convert quotation to rental order
- **Headers**: `Authorization: Bearer <token>`

### DELETE /api/quotations/:id
- **Description**: Cancel quotation
- **Headers**: `Authorization: Bearer <token>`

### POST /api/quotations/:id/send
- **Description**: Send quotation to customer via email
- **Headers**: `Authorization: Bearer <admin_token>`

## Rental Order APIs

### GET /api/orders
- **Description**: Get rental orders
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: number
  - `limit`: number
  - `status`: "confirmed" | "reserved" | "pickup" | "active" | "returned" | "cancelled"
  - `startDate`: ISO date string
  - `endDate`: ISO date string

### POST /api/orders
- **Description**: Create rental order directly (without quotation)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: Same as quotation creation

### GET /api/orders/:id
- **Description**: Get order details
- **Headers**: `Authorization: Bearer <token>`

### PUT /api/orders/:id/status
- **Description**: Update order status (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "status": "confirmed | reserved | pickup | active | returned | cancelled",
    "notes": "string?"
  }
  ```

### POST /api/orders/:id/pickup
- **Description**: Mark order as picked up
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "pickupDate": "Date",
    "deliveredBy": "string",
    "notes": "string?"
  }
  ```

### POST /api/orders/:id/return
- **Description**: Process order return
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "returnDate": "Date",
    "condition": "good | damaged | lost",
    "notes": "string?",
    "lateFees": "number?"
  }
  ```

### GET /api/orders/:id/contract
- **Description**: Generate rental contract PDF
- **Headers**: `Authorization: Bearer <token>`

## Payment APIs

### GET /api/payments
- **Description**: Get payment history
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: number
  - `limit`: number
  - `orderId`: string
  - `status`: "pending" | "completed" | "failed" | "refunded"

### POST /api/payments/intent
- **Description**: Create payment intent for Stripe/Razorpay
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "orderId": "string",
    "amount": "number",
    "currency": "string",
    "paymentMethod": "stripe | razorpay | paypal"
  }
  ```

### POST /api/payments/confirm
- **Description**: Confirm payment completion
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "paymentIntentId": "string",
    "transactionId": "string",
    "orderId": "string"
  }
  ```

### POST /api/payments/refund
- **Description**: Process payment refund (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "paymentId": "string",
    "amount": "number",
    "reason": "string"
  }
  ```

## Invoice APIs

### GET /api/invoices
- **Description**: Get invoices
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: number
  - `limit`: number
  - `status`: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  - `orderId`: string

### POST /api/invoices
- **Description**: Create invoice for order (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "orderId": "string",
    "amount": "number",
    "dueDate": "Date",
    "type": "full | partial | deposit"
  }
  ```

### GET /api/invoices/:id
- **Description**: Get invoice details
- **Headers**: `Authorization: Bearer <token>`

### GET /api/invoices/:id/pdf
- **Description**: Download invoice PDF
- **Headers**: `Authorization: Bearer <token>`

### POST /api/invoices/:id/send
- **Description**: Send invoice via email (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`

## Pricing & Pricelist APIs

### GET /api/pricelists
- **Description**: Get all pricelists (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`

### POST /api/pricelists
- **Description**: Create new pricelist (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "customerSegment": "standard | corporate | vip",
    "rules": [
      {
        "productId": "string?",
        "categoryId": "string?",
        "duration": {
          "value": "number",
          "unit": "hour | day | week | month"
        },
        "priceType": "fixed | percentage",
        "value": "number",
        "minQuantity": "number?",
        "maxQuantity": "number?"
      }
    ],
    "validFrom": "Date",
    "validTo": "Date"
  }
  ```

### GET /api/pricing/calculate
- **Description**: Calculate pricing for products and duration
- **Query Parameters**:
  - `productId`: string
  - `quantity`: number
  - `duration`: string (JSON encoded)
  - `customerId`: string (for customer-specific pricing)

## Customer Management APIs

### GET /api/customers
- **Description**: Get all customers (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `page`: number
  - `limit`: number
  - `search`: string
  - `customerType`: "individual | corporate"

### GET /api/customers/:id
- **Description**: Get customer details
- **Headers**: `Authorization: Bearer <token>`

### PUT /api/customers/:id
- **Description**: Update customer profile
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: Partial Customer object

### GET /api/customers/:id/orders
- **Description**: Get customer order history
- **Headers**: `Authorization: Bearer <token>`

### GET /api/customers/:id/stats
- **Description**: Get customer statistics
- **Headers**: `Authorization: Bearer <token>`

## Notification APIs

### GET /api/notifications
- **Description**: Get user notifications
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: number
  - `limit`: number
  - `isRead`: boolean
  - `type`: "rental_reminder" | "payment_due" | "late_return" | "pickup_ready"

### PUT /api/notifications/:id/read
- **Description**: Mark notification as read
- **Headers**: `Authorization: Bearer <token>`

### PUT /api/notifications/read-all
- **Description**: Mark all notifications as read
- **Headers**: `Authorization: Bearer <token>`

### POST /api/notifications/settings
- **Description**: Update notification preferences
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "emailNotifications": "boolean",
    "smsNotifications": "boolean",
    "reminderDays": "number"
  }
  ```

## Dashboard & Analytics APIs

### GET /api/dashboard/stats
- **Description**: Get dashboard statistics (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalRevenue": "number",
      "activeRentals": "number",
      "totalCustomers": "number",
      "pendingReturns": "number",
      "revenueGrowth": "number",
      "customerGrowth": "number"
    }
  }
  ```

### GET /api/dashboard/revenue
- **Description**: Get revenue analytics
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `period`: "daily" | "weekly" | "monthly" | "yearly"
  - `startDate`: ISO date string
  - `endDate`: ISO date string

### GET /api/dashboard/products/popular
- **Description**: Get most rented products
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `limit`: number (default: 10)
  - `period`: "daily" | "weekly" | "monthly" | "yearly"

### GET /api/dashboard/customers/top
- **Description**: Get top customers by revenue
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `limit`: number (default: 10)
  - `period`: "daily" | "weekly" | "monthly" | "yearly"

## Reports APIs

### GET /api/reports/rental-summary
- **Description**: Generate rental summary report
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `format`: "json" | "pdf" | "xlsx" | "csv"

### GET /api/reports/revenue
- **Description**: Generate revenue report
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `groupBy`: "daily" | "weekly" | "monthly"
  - `format`: "json" | "pdf" | "xlsx" | "csv"

### GET /api/reports/customer-activity
- **Description**: Generate customer activity report
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**: Same as above

### GET /api/reports/product-performance
- **Description**: Generate product performance report
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**: Same as above

### GET /api/reports/late-returns
- **Description**: Generate late returns report
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**: Same as above

## Delivery Management APIs

### GET /api/deliveries
- **Description**: Get delivery/pickup schedules (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `date`: ISO date string
  - `type`: "pickup" | "return"
  - `status`: "pending" | "in_progress" | "completed"

### PUT /api/deliveries/:id/status
- **Description**: Update delivery status
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "status": "pending | in_progress | completed",
    "notes": "string?",
    "deliveredBy": "string?"
  }
  ```

### GET /api/deliveries/schedule
- **Description**: Get delivery schedule for specific date
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `date`: ISO date string

## Inventory Management APIs

### GET /api/inventory
- **Description**: Get inventory status (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `productId`: string
  - `category`: string
  - `status`: "available" | "rented" | "maintenance"

### PUT /api/inventory/:productId/status
- **Description**: Update product inventory status
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "status": "available | rented | maintenance",
    "quantity": "number",
    "notes": "string?"
  }
  ```

### GET /api/inventory/alerts
- **Description**: Get low stock and maintenance alerts
- **Headers**: `Authorization: Bearer <admin_token>`

## File Upload APIs

### POST /api/upload/product-image
- **Description**: Upload product image
- **Headers**: `Authorization: Bearer <admin_token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**: FormData with file

### POST /api/upload/documents
- **Description**: Upload documents (contracts, invoices)
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`

## Webhook APIs

### POST /api/webhooks/stripe
- **Description**: Stripe payment webhook
- **Headers**: `Stripe-Signature: <signature>`

### POST /api/webhooks/razorpay
- **Description**: Razorpay payment webhook
- **Headers**: `X-Razorpay-Signature: <signature>`

### POST /api/webhooks/paypal
- **Description**: PayPal payment webhook

## System Configuration APIs

### GET /api/config/system
- **Description**: Get system configuration (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`

### PUT /api/config/system
- **Description**: Update system configuration (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
  ```json
  {
    "currency": "string",
    "timezone": "string",
    "lateFeeRate": "number",
    "reminderDays": "number",
    "minimumRentalDuration": "number"
  }
  ```

### GET /api/config/payment-gateways
- **Description**: Get payment gateway settings (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`

### PUT /api/config/payment-gateways
- **Description**: Update payment gateway settings (Admin only)
- **Headers**: `Authorization: Bearer <admin_token>`

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

## Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

## Authentication

Most APIs require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

Admin-only APIs require admin role in JWT payload.

## Rate Limiting

- Public APIs: 100 requests per minute
- Authenticated APIs: 1000 requests per minute
- Admin APIs: 5000 requests per minute

## Pagination

List APIs support pagination with these query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

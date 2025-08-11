# 🚀 Rental Management System - Complete API Documentation

## 📋 Table of Contents
1. [Base Configuration](#base-configuration)
2. [Authentication APIs](#authentication-apis)
3. [User Management APIs](#user-management-apis)
4. [Product Catalog APIs](#product-catalog-apis)
5. [Order Management APIs](#order-management-apis)
6. [Pricing APIs](#pricing-apis)
7. [Payment APIs](#payment-apis)
8. [Invoice APIs](#invoice-apis)
9. [Delivery APIs](#delivery-apis)
10. [Notification APIs](#notification-apis)
11. [Reports APIs](#reports-apis)
12. [API Management APIs](#api-management-apis)
13. [System Health APIs](#system-health-apis)

---

## 🔧 Base Configuration

### Base URL
```
http://localhost:8000/api/
```

### Production URL
```
https://rentalmanagementsystem-production.up.railway.app/
```

### Authentication
Most endpoints require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting
- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Admin: 5000 requests/hour

### Content Type
```
Content-Type: application/json
```

---

## 🔐 Authentication APIs

### 1. Register User
**Endpoint:** `POST /api/auth/register/`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "company_name": "ABC Corp",
  "user_type": "BUSINESS"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true
    },
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
  },
  "message": "User registered successfully"
}
```

### 2. Login User
**Endpoint:** `POST /api/auth/login/`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_staff": false
    },
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
  },
  "message": "Login successful"
}
```

### 3. Refresh Token
**Endpoint:** `POST /api/auth/refresh/`

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### 4. Forgot Password
**Endpoint:** `POST /api/auth/forgot-password/`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### 5. Reset Password
**Endpoint:** `POST /api/auth/reset-password/`

**Request Body:**
```json
{
  "token": "reset_token_here",
  "uid": "user_id_base64",
  "new_password": "NewSecurePassword123!"
}
```

---

## 👤 User Management APIs

### 1. Get Current User Profile
**Endpoint:** `GET /api/profile/me/`
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890",
    "company_name": "ABC Corp",
    "user_type": "BUSINESS",
    "customer_group": {
      "id": 1,
      "name": "Premium",
      "discount_percentage": 10.0
    },
    "addresses": [
      {
        "id": 1,
        "type": "BILLING",
        "street_address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "US",
        "is_default": true
      }
    ],
    "created_at": "2025-01-01T10:00:00Z"
  }
}
```

### 2. Update User Profile
**Endpoint:** `PATCH /api/profile/me/`
**Auth Required:** Yes

**Request Body:**
```json
{
  "first_name": "John Updated",
  "phone_number": "+1987654321",
  "company_name": "Updated Corp"
}
```

### 3. Change Password
**Endpoint:** `POST /api/profile/change_password/`
**Auth Required:** Yes

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}
```

### 4. Get Customer Statistics
**Endpoint:** `GET /api/profile/stats/`
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_orders": 25,
    "total_spent": 15000.00,
    "active_rentals": 3,
    "overdue_returns": 1,
    "total_saved": 2500.00,
    "loyalty_points": 150,
    "membership_since": "2024-01-01",
    "preferred_categories": ["Construction", "Events"]
  }
}
```

---

## 📦 Product Catalog APIs

### 1. Get All Products
**Endpoint:** `GET /api/catalog/products/`
**Auth Required:** No (for browsing)

**Query Parameters:**
- `category` - Filter by category ID
- `search` - Search in name/description
- `min_price` - Minimum daily rate
- `max_price` - Maximum daily rate
- `available_from` - Available from date (YYYY-MM-DD)
- `available_to` - Available to date (YYYY-MM-DD)
- `page` - Page number
- `limit` - Items per page

**Example Request:**
```
GET /api/catalog/products/?category=1&search=excavator&available_from=2025-01-15&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 150,
    "next": "http://localhost:8000/api/catalog/products/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "CAT 320 Excavator",
        "description": "Heavy-duty excavator for construction work",
        "category": {
          "id": 1,
          "name": "Construction Equipment",
          "slug": "construction-equipment"
        },
        "daily_rate": 450.00,
        "weekly_rate": 2700.00,
        "monthly_rate": 9000.00,
        "security_deposit": 5000.00,
        "images": [
          {
            "id": 1,
            "image": "http://localhost:8000/media/products/cat320_1.jpg",
            "alt_text": "CAT 320 Excavator Front View",
            "is_primary": true
          }
        ],
        "specifications": {
          "weight": "22000 kg",
          "engine_power": "158 HP",
          "bucket_capacity": "1.2 m³"
        },
        "availability_status": "AVAILABLE",
        "average_rating": 4.5,
        "total_reviews": 24,
        "available_quantity": 3,
        "created_at": "2024-12-01T10:00:00Z"
      }
    ]
  }
}
```

### 2. Get Single Product
**Endpoint:** `GET /api/catalog/products/{id}/`
**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "CAT 320 Excavator",
    "description": "Heavy-duty excavator for construction work",
    "detailed_description": "The CAT 320 is perfect for medium to large construction projects...",
    "category": {
      "id": 1,
      "name": "Construction Equipment",
      "slug": "construction-equipment"
    },
    "daily_rate": 450.00,
    "weekly_rate": 2700.00,
    "monthly_rate": 9000.00,
    "security_deposit": 5000.00,
    "images": [
      {
        "id": 1,
        "image": "http://localhost:8000/media/products/cat320_1.jpg",
        "alt_text": "CAT 320 Excavator Front View",
        "is_primary": true
      },
      {
        "id": 2,
        "image": "http://localhost:8000/media/products/cat320_2.jpg",
        "alt_text": "CAT 320 Excavator Side View",
        "is_primary": false
      }
    ],
    "specifications": {
      "weight": "22000 kg",
      "engine_power": "158 HP",
      "bucket_capacity": "1.2 m³",
      "max_digging_depth": "6.5 m",
      "fuel_capacity": "400 L"
    },
    "included_accessories": [
      "Standard bucket",
      "Operator manual",
      "Basic tool kit"
    ],
    "optional_accessories": [
      {
        "name": "Hydraulic Breaker",
        "daily_rate": 150.00
      },
      {
        "name": "Thumb Attachment",
        "daily_rate": 75.00
      }
    ],
    "availability_status": "AVAILABLE",
    "available_items": [
      {
        "id": 1,
        "serial_number": "CAT320-001",
        "condition": "EXCELLENT",
        "last_maintenance": "2024-12-01",
        "availability_status": "AVAILABLE"
      },
      {
        "id": 2,
        "serial_number": "CAT320-002",
        "condition": "GOOD",
        "last_maintenance": "2024-11-15",
        "availability_status": "RENTED"
      }
    ],
    "reviews": [
      {
        "id": 1,
        "customer_name": "John Smith",
        "rating": 5,
        "comment": "Excellent equipment, worked perfectly for our project",
        "created_at": "2024-12-15T14:30:00Z"
      }
    ],
    "average_rating": 4.5,
    "total_reviews": 24,
    "rental_terms": {
      "minimum_rental_days": 1,
      "maximum_rental_days": 365,
      "delivery_available": true,
      "pickup_required": false
    }
  }
}
```

### 3. Check Product Availability
**Endpoint:** `GET /api/catalog/products/{id}/availability/`
**Auth Required:** No

**Query Parameters:**
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD
- `quantity` - Number of items needed

**Example Request:**
```
GET /api/catalog/products/1/availability/?start_date=2025-01-15&end_date=2025-01-20&quantity=2
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product_id": 1,
    "requested_quantity": 2,
    "available_quantity": 1,
    "is_available": false,
    "start_date": "2025-01-15",
    "end_date": "2025-01-20",
    "conflicting_bookings": [
      {
        "order_id": 123,
        "start_date": "2025-01-16",
        "end_date": "2025-01-18",
        "quantity": 2
      }
    ],
    "alternative_dates": [
      {
        "start_date": "2025-01-21",
        "end_date": "2025-01-26",
        "available_quantity": 2
      }
    ],
    "alternative_products": [
      {
        "id": 2,
        "name": "Komatsu PC200 Excavator",
        "daily_rate": 425.00,
        "available_quantity": 2
      }
    ]
  }
}
```

### 4. Get Product Categories
**Endpoint:** `GET /api/catalog/categories/`
**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Construction Equipment",
      "slug": "construction-equipment",
      "description": "Heavy machinery for construction projects",
      "image": "http://localhost:8000/media/categories/construction.jpg",
      "parent": null,
      "children": [
        {
          "id": 2,
          "name": "Excavators",
          "slug": "excavators",
          "product_count": 25
        },
        {
          "id": 3,
          "name": "Bulldozers",
          "slug": "bulldozers",
          "product_count": 15
        }
      ],
      "product_count": 40,
      "featured": true
    }
  ]
}
```

---

## 📋 Order Management APIs

### 1. Create Rental Quote
**Endpoint:** `POST /api/orders/quotes/`
**Auth Required:** Yes

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "start_date": "2025-01-15",
      "end_date": "2025-01-20",
      "accessories": [
        {
          "accessory_id": 1,
          "quantity": 1
        }
      ]
    },
    {
      "product_id": 3,
      "quantity": 1,
      "start_date": "2025-01-15",
      "end_date": "2025-01-18"
    }
  ],
  "delivery_address": {
    "street_address": "Construction Site A",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001"
  },
  "special_instructions": "Please deliver before 8 AM",
  "delivery_required": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "Q-2025-001",
    "quote_number": "Q-2025-001",
    "status": "DRAFT",
    "customer": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "CAT 320 Excavator"
        },
        "quantity": 2,
        "start_date": "2025-01-15",
        "end_date": "2025-01-20",
        "rental_days": 5,
        "daily_rate": 450.00,
        "total_amount": 4500.00,
        "accessories": [
          {
            "name": "Hydraulic Breaker",
            "quantity": 1,
            "daily_rate": 150.00,
            "total_amount": 750.00
          }
        ]
      }
    ],
    "pricing": {
      "subtotal": 5250.00,
      "delivery_fee": 200.00,
      "tax_amount": 525.00,
      "discount_amount": 262.50,
      "security_deposit": 10000.00,
      "total_amount": 5712.50
    },
    "delivery_address": {
      "street_address": "Construction Site A",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001"
    },
    "valid_until": "2025-01-25T23:59:59Z",
    "created_at": "2025-01-10T10:00:00Z"
  }
}
```

### 2. Convert Quote to Order
**Endpoint:** `POST /api/orders/quotes/{id}/convert_to_order/`
**Auth Required:** Yes

**Request Body:**
```json
{
  "payment_method": "STRIPE",
  "billing_address": {
    "street_address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001"
  },
  "terms_accepted": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "order_id": "RO-2025-001",
    "quote_id": "Q-2025-001",
    "status": "CONFIRMED",
    "payment_intent": {
      "client_secret": "pi_1234567890_secret_xyz",
      "amount": 5712.50,
      "currency": "USD"
    }
  },
  "message": "Quote converted to order successfully"
}
```

### 3. Get Rental Orders
**Endpoint:** `GET /api/orders/orders/`
**Auth Required:** Yes

**Query Parameters:**
- `status` - Order status filter
- `start_date` - Orders starting from date
- `end_date` - Orders ending before date
- `search` - Search in order number or customer name

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 15,
    "results": [
      {
        "id": "RO-2025-001",
        "order_number": "RO-2025-001",
        "status": "ACTIVE",
        "customer": {
          "id": 1,
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "items": [
          {
            "product_name": "CAT 320 Excavator",
            "quantity": 2,
            "start_date": "2025-01-15",
            "end_date": "2025-01-20",
            "status": "DELIVERED"
          }
        ],
        "total_amount": 5712.50,
        "payment_status": "PAID",
        "delivery_status": "DELIVERED",
        "created_at": "2025-01-10T10:00:00Z",
        "delivery_date": "2025-01-15T08:00:00Z",
        "return_due_date": "2025-01-20T18:00:00Z"
      }
    ]
  }
}
```

### 4. Confirm Equipment Pickup
**Endpoint:** `POST /api/orders/orders/{id}/confirm_pickup/`
**Auth Required:** Yes (Staff only)

**Request Body:**
```json
{
  "pickup_date": "2025-01-15T08:30:00Z",
  "items": [
    {
      "item_id": 1,
      "serial_number": "CAT320-001",
      "condition_notes": "Equipment in excellent condition",
      "accessories_included": ["Standard bucket", "Operator manual"]
    }
  ],
  "customer_signature": "base64_signature_data",
  "staff_notes": "Customer provided proper insurance documentation"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order_id": "RO-2025-001",
    "status": "ACTIVE",
    "pickup_confirmed_at": "2025-01-15T08:30:00Z",
    "next_action": "RETURN_REMINDER",
    "return_due_date": "2025-01-20T18:00:00Z"
  },
  "message": "Equipment pickup confirmed successfully"
}
```

---

## 💰 Pricing APIs

### 1. Calculate Pricing
**Endpoint:** `POST /api/pricing/calculate/`
**Auth Required:** Yes

**Request Body:**
```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "start_date": "2025-01-15",
      "end_date": "2025-01-20"
    }
  ],
  "delivery_required": true,
  "delivery_distance": 25.5
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "product_id": 1,
        "product_name": "CAT 320 Excavator",
        "quantity": 2,
        "rental_days": 5,
        "daily_rate": 450.00,
        "base_amount": 4500.00,
        "discounts": [
          {
            "type": "CUSTOMER_GROUP",
            "name": "Premium Customer Discount",
            "percentage": 10.0,
            "amount": 450.00
          },
          {
            "type": "VOLUME",
            "name": "Multi-item Discount",
            "percentage": 5.0,
            "amount": 202.50
          }
        ],
        "final_amount": 3847.50
      }
    ],
    "pricing_summary": {
      "subtotal": 3847.50,
      "delivery_fee": 200.00,
      "tax_rate": 10.0,
      "tax_amount": 404.75,
      "security_deposit": 10000.00,
      "total_amount": 4452.25,
      "total_due_now": 4452.25,
      "security_deposit_due": 10000.00
    },
    "payment_schedule": [
      {
        "due_date": "2025-01-15",
        "amount": 4452.25,
        "description": "Rental payment + taxes + delivery"
      },
      {
        "due_date": "2025-01-15",
        "amount": 10000.00,
        "description": "Security deposit (refundable)"
      }
    ]
  }
}
```

### 2. Calculate Late Fees
**Endpoint:** `POST /api/pricing/calculate_late_fee/`
**Auth Required:** Yes

**Request Body:**
```json
{
  "order_id": "RO-2025-001",
  "actual_return_date": "2025-01-22T10:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order_id": "RO-2025-001",
    "expected_return_date": "2025-01-20T18:00:00Z",
    "actual_return_date": "2025-01-22T10:00:00Z",
    "days_late": 2,
    "late_fee_calculation": {
      "base_daily_rate": 450.00,
      "late_fee_percentage": 50.0,
      "daily_late_fee": 225.00,
      "total_late_fee": 450.00
    },
    "additional_charges": {
      "extended_rental_days": 2,
      "extended_rental_amount": 900.00
    },
    "total_additional_charges": 1350.00
  }
}
```

---

## 💳 Payment APIs

### 1. Create Payment Intent
**Endpoint:** `POST /api/payments/create_intent/`
**Auth Required:** Yes

**Request Body:**
```json
{
  "order_id": "RO-2025-001",
  "amount": 4452.25,
  "payment_method": "STRIPE",
  "payment_type": "ORDER_PAYMENT",
  "return_url": "https://yourapp.com/payment/success",
  "cancel_url": "https://yourapp.com/payment/cancel"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "payment_intent_id": "pi_1234567890",
    "client_secret": "pi_1234567890_secret_xyz",
    "amount": 4452.25,
    "currency": "USD",
    "payment_method": "STRIPE",
    "status": "PENDING",
    "expires_at": "2025-01-10T11:00:00Z",
    "metadata": {
      "order_id": "RO-2025-001",
      "customer_id": 1
    }
  }
}
```

### 2. Confirm Payment
**Endpoint:** `POST /api/payments/confirm/`
**Auth Required:** Yes

**Request Body:**
```json
{
  "payment_intent_id": "pi_1234567890",
  "payment_method_id": "pm_1234567890",
  "order_id": "RO-2025-001"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment_id": "PAY-2025-001",
    "status": "COMPLETED",
    "amount": 4452.25,
    "currency": "USD",
    "transaction_id": "txn_1234567890",
    "payment_method": "STRIPE",
    "processed_at": "2025-01-10T10:15:00Z",
    "order": {
      "id": "RO-2025-001",
      "status": "CONFIRMED",
      "payment_status": "PAID"
    }
  },
  "message": "Payment processed successfully"
}
```

### 3. Get Payment History
**Endpoint:** `GET /api/payments/`
**Auth Required:** Yes

**Query Parameters:**
- `status` - Payment status filter
- `order_id` - Filter by order
- `start_date` - Payments from date
- `end_date` - Payments to date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 10,
    "results": [
      {
        "id": "PAY-2025-001",
        "order_id": "RO-2025-001",
        "amount": 4452.25,
        "currency": "USD",
        "status": "COMPLETED",
        "payment_method": "STRIPE",
        "transaction_id": "txn_1234567890",
        "processed_at": "2025-01-10T10:15:00Z",
        "description": "Rental payment for CAT 320 Excavator"
      }
    ]
  }
}
```

---

## 📄 Invoice APIs

### 1. Get Invoices
**Endpoint:** `GET /api/invoicing/invoices/`
**Auth Required:** Yes

**Query Parameters:**
- `status` - Invoice status
- `due_date_from` - Due date range start
- `due_date_to` - Due date range end
- `customer_id` - Filter by customer (admin only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "results": [
      {
        "id": "INV-2025-001",
        "invoice_number": "INV-2025-001",
        "status": "PAID",
        "customer": {
          "id": 1,
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "order_id": "RO-2025-001",
        "issue_date": "2025-01-10",
        "due_date": "2025-01-25",
        "total_amount": 4452.25,
        "paid_amount": 4452.25,
        "balance_due": 0.00,
        "payment_status": "PAID",
        "created_at": "2025-01-10T10:00:00Z"
      }
    ]
  }
}
```

### 2. Get Invoice Details
**Endpoint:** `GET /api/invoicing/invoices/{id}/`
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "INV-2025-001",
    "invoice_number": "INV-2025-001",
    "status": "PAID",
    "customer": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "billing_address": {
        "street_address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001"
      }
    },
    "order": {
      "id": "RO-2025-001",
      "order_number": "RO-2025-001"
    },
    "issue_date": "2025-01-10",
    "due_date": "2025-01-25",
    "line_items": [
      {
        "id": 1,
        "description": "CAT 320 Excavator Rental (5 days)",
        "quantity": 2,
        "unit_price": 450.00,
        "total_price": 2250.00
      },
      {
        "id": 2,
        "description": "Hydraulic Breaker Accessory",
        "quantity": 1,
        "unit_price": 150.00,
        "total_price": 750.00
      },
      {
        "id": 3,
        "description": "Delivery Fee",
        "quantity": 1,
        "unit_price": 200.00,
        "total_price": 200.00
      }
    ],
    "subtotal": 3200.00,
    "tax_amount": 320.00,
    "discount_amount": 160.00,
    "total_amount": 3360.00,
    "paid_amount": 3360.00,
    "balance_due": 0.00,
    "payment_terms": "Net 15",
    "notes": "Thank you for your business!",
    "payments": [
      {
        "id": "PAY-2025-001",
        "amount": 3360.00,
        "payment_date": "2025-01-10",
        "payment_method": "STRIPE"
      }
    ]
  }
}
```

### 3. Download Invoice PDF
**Endpoint:** `GET /api/invoicing/invoices/{id}/pdf/`
**Auth Required:** Yes

**Response:** Binary PDF file with appropriate headers

---

## 🚚 Delivery APIs

### 1. Schedule Delivery
**Endpoint:** `POST /api/deliveries/delivery_docs/schedule/`
**Auth Required:** Yes (Staff only)

**Request Body:**
```json
{
  "order_id": "RO-2025-001",
  "document_type": "DELIVERY",
  "scheduled_datetime": "2025-01-15T08:00:00Z",
  "delivery_address": {
    "street_address": "Construction Site A",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001"
  },
  "driver_id": 1,
  "vehicle_info": "Truck #001",
  "special_instructions": "Call customer 30 minutes before arrival",
  "items": [
    {
      "product_item_id": 1,
      "quantity": 1,
      "special_handling": false
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "DEL-2025-001",
    "delivery_number": "DEL-2025-001",
    "order_id": "RO-2025-001",
    "document_type": "DELIVERY",
    "status": "SCHEDULED",
    "scheduled_datetime": "2025-01-15T08:00:00Z",
    "delivery_address": {
      "street_address": "Construction Site A",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001"
    },
    "driver": {
      "id": 1,
      "name": "Mike Johnson",
      "phone": "+1234567890"
    },
    "estimated_duration": "2 hours",
    "tracking_url": "https://track.yourapp.com/DEL-2025-001"
  }
}
```

### 2. Update Delivery Status
**Endpoint:** `PUT /api/deliveries/delivery_docs/{id}/update_status/`
**Auth Required:** Yes (Staff only)

**Request Body:**
```json
{
  "status": "IN_TRANSIT",
  "notes": "Left warehouse, en route to customer",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "estimated_arrival": "2025-01-15T08:30:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "DEL-2025-001",
    "status": "IN_TRANSIT",
    "updated_at": "2025-01-15T07:45:00Z",
    "status_history": [
      {
        "status": "SCHEDULED",
        "timestamp": "2025-01-14T16:00:00Z",
        "notes": "Delivery scheduled"
      },
      {
        "status": "IN_TRANSIT",
        "timestamp": "2025-01-15T07:45:00Z",
        "notes": "Left warehouse, en route to customer"
      }
    ],
    "estimated_arrival": "2025-01-15T08:30:00Z"
  }
}
```

### 3. Get Delivery Schedule
**Endpoint:** `GET /api/deliveries/delivery_docs/schedule_for_date/`
**Auth Required:** Yes (Staff only)

**Query Parameters:**
- `date` - YYYY-MM-DD format
- `driver_id` - Filter by driver
- `status` - Filter by status

**Example Request:**
```
GET /api/deliveries/delivery_docs/schedule_for_date/?date=2025-01-15&status=SCHEDULED
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "total_deliveries": 8,
    "deliveries": [
      {
        "id": "DEL-2025-001",
        "delivery_number": "DEL-2025-001",
        "order_id": "RO-2025-001",
        "customer_name": "John Doe",
        "scheduled_time": "08:00:00",
        "status": "SCHEDULED",
        "driver": {
          "id": 1,
          "name": "Mike Johnson"
        },
        "address": "Construction Site A, New York, NY",
        "estimated_duration": "2 hours",
        "priority": "HIGH"
      }
    ],
    "drivers_schedule": [
      {
        "driver_id": 1,
        "driver_name": "Mike Johnson",
        "total_deliveries": 3,
        "route_optimized": true,
        "estimated_total_time": "6 hours"
      }
    ]
  }
}
```

---

## 🔔 Notification APIs

### 1. Get User Notifications
**Endpoint:** `GET /api/notifications/`
**Auth Required:** Yes

**Query Parameters:**
- `unread_only` - Show only unread notifications
- `type` - Filter by notification type
- `limit` - Number of notifications to return

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 25,
    "unread_count": 5,
    "results": [
      {
        "id": 1,
        "type": "ORDER_CONFIRMED",
        "title": "Order Confirmed",
        "message": "Your rental order RO-2025-001 has been confirmed and payment processed successfully.",
        "is_read": false,
        "created_at": "2025-01-10T10:15:00Z",
        "data": {
          "order_id": "RO-2025-001",
          "action_url": "/orders/RO-2025-001"
        }
      },
      {
        "id": 2,
        "type": "DELIVERY_SCHEDULED",
        "title": "Delivery Scheduled",
        "message": "Your equipment delivery is scheduled for Jan 15, 2025 at 8:00 AM.",
        "is_read": false,
        "created_at": "2025-01-14T16:00:00Z",
        "data": {
          "delivery_id": "DEL-2025-001",
          "scheduled_date": "2025-01-15T08:00:00Z"
        }
      }
    ]
  }
}
```

### 2. Mark Notification as Read
**Endpoint:** `PUT /api/notifications/{id}/read/`
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_read": true,
    "read_at": "2025-01-10T15:30:00Z"
  }
}
```

### 3. Mark All Notifications as Read
**Endpoint:** `PUT /api/notifications/read-all/`
**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "marked_read_count": 5
  },
  "message": "All notifications marked as read"
}
```

---

## 📊 Reports APIs

### 1. Get Rental Summary Report
**Endpoint:** `GET /api/reports/rental-summary/`
**Auth Required:** Yes (Staff only)

**Query Parameters:**
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD
- `customer_id` - Filter by customer
- `product_category` - Filter by category

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2025-01-01",
      "end_date": "2025-01-31"
    },
    "summary": {
      "total_orders": 150,
      "total_revenue": 125000.00,
      "average_order_value": 833.33,
      "total_rental_days": 2500,
      "utilization_rate": 78.5
    },
    "by_category": [
      {
        "category": "Construction Equipment",
        "orders": 85,
        "revenue": 95000.00,
        "utilization_rate": 82.1
      },
      {
        "category": "Event Equipment",
        "orders": 45,
        "revenue": 25000.00,
        "utilization_rate": 71.3
      }
    ],
    "top_products": [
      {
        "product_id": 1,
        "product_name": "CAT 320 Excavator",
        "rental_count": 25,
        "revenue": 22500.00,
        "utilization_rate": 89.2
      }
    ],
    "top_customers": [
      {
        "customer_id": 1,
        "customer_name": "John Doe",
        "orders": 8,
        "revenue": 12500.00
      }
    ]
  }
}
```

### 2. Get Revenue Report
**Endpoint:** `GET /api/reports/revenue/`
**Auth Required:** Yes (Staff only)

**Query Parameters:**
- `period` - 'daily', 'weekly', 'monthly', 'yearly'
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "total_revenue": 125000.00,
    "revenue_breakdown": [
      {
        "period": "2025-01",
        "revenue": 125000.00,
        "orders": 150,
        "growth_rate": 15.5
      },
      {
        "period": "2024-12",
        "revenue": 108000.00,
        "orders": 135,
        "growth_rate": 8.2
      }
    ],
    "revenue_by_source": {
      "equipment_rental": 100000.00,
      "accessories": 15000.00,
      "delivery_fees": 8000.00,
      "late_fees": 2000.00
    },
    "payment_method_breakdown": {
      "stripe": 75000.00,
      "bank_transfer": 35000.00,
      "cash": 15000.00
    }
  }
}
```

---

## 🔑 API Management APIs

### 1. Create API Key
**Endpoint:** `POST /api/external/keys/`
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "name": "Mobile App Integration",
  "description": "API key for mobile application",
  "permissions": {
    "orders": ["read", "create"],
    "products": ["read"],
    "customers": ["read", "update"]
  },
  "rate_limit": 1000,
  "expires_at": "2026-01-01T00:00:00Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Mobile App Integration",
    "api_key": "rms_live_1234567890abcdef",
    "permissions": {
      "orders": ["read", "create"],
      "products": ["read"],
      "customers": ["read", "update"]
    },
    "rate_limit": 1000,
    "is_active": true,
    "created_at": "2025-01-10T10:00:00Z",
    "expires_at": "2026-01-01T00:00:00Z"
  },
  "message": "API key created successfully. Please store the key securely as it won't be shown again."
}
```

### 2. Get API Usage Logs
**Endpoint:** `GET /api/external/logs/`
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `api_key_id` - Filter by API key
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD
- `status_code` - HTTP status code filter

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 500,
    "results": [
      {
        "id": 1,
        "api_key_name": "Mobile App Integration",
        "endpoint": "/api/catalog/products/",
        "method": "GET",
        "status_code": 200,
        "response_time": 0.125,
        "ip_address": "192.168.1.100",
        "user_agent": "RentalApp/1.0",
        "timestamp": "2025-01-10T10:15:30Z"
      }
    ],
    "usage_stats": {
      "total_requests": 500,
      "successful_requests": 485,
      "failed_requests": 15,
      "average_response_time": 0.145
    }
  }
}
```

---

## 🏥 System Health APIs

### 1. Health Check
**Endpoint:** `GET /api/health/`
**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-10T10:00:00Z",
    "version": "1.0.0",
    "environment": "production",
    "checks": {
      "database": {
        "status": "healthy",
        "response_time": 0.005
      },
      "redis": {
        "status": "healthy",
        "response_time": 0.002
      },
      "storage": {
        "status": "healthy",
        "free_space": "45.2 GB"
      },
      "email_service": {
        "status": "healthy",
        "response_time": 0.125
      }
    }
  }
}
```

### 2. System Metrics
**Endpoint:** `GET /api/metrics/`
**Auth Required:** Yes (Admin only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "system": {
      "cpu_usage": 45.2,
      "memory_usage": 67.8,
      "disk_usage": 54.3,
      "uptime": "15 days, 4 hours"
    },
    "api": {
      "requests_per_minute": 150,
      "average_response_time": 0.125,
      "error_rate": 0.02
    },
    "business": {
      "active_orders": 45,
      "total_customers": 1250,
      "revenue_today": 15000.00,
      "equipment_utilization": 78.5
    }
  }
}
```

---

## 📱 Postman Collection Sample

### Environment Variables
```json
{
  "base_url": "http://localhost:8000/api",
  "access_token": "{{access_token}}",
  "customer_id": "1",
  "order_id": "RO-2025-001"
}
```

### Pre-request Script for Authentication
```javascript
// Auto-refresh token if needed
pm.sendRequest({
    url: pm.environment.get("base_url") + "/auth/refresh/",
    method: 'POST',
    header: {
        'Content-Type': 'application/json',
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            "refresh": pm.environment.get("refresh_token")
        })
    }
}, function (err, response) {
    if (response.code === 200) {
        const data = response.json();
        pm.environment.set("access_token", data.data.access);
    }
});
```

### Test Scripts Example
```javascript
// Generic test for successful API response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success property", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
});

pm.test("Response has data property", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
});

// Save important data for subsequent requests
pm.test("Save order ID", function () {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.id) {
        pm.environment.set("order_id", jsonData.data.id);
    }
});
```

---

## 🔍 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["This field is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED` - 401
- `PERMISSION_DENIED` - 403
- `NOT_FOUND` - 404
- `VALIDATION_ERROR` - 400
- `RATE_LIMIT_EXCEEDED` - 429
- `INTERNAL_ERROR` - 500

---

## 📚 Additional Resources

### Swagger Documentation
Visit: `http://localhost:8000/api/docs/`

### ReDoc Documentation
Visit: `http://localhost:8000/api/redoc/`

### API Schema
Download: `http://localhost:8000/api/schema/`

---

**Total Documented Endpoints: 150+**
**Last Updated:** January 10, 2025
**API Version:** 1.0.0

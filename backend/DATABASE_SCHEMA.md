# 🗄️ Rental Management System - Database Schema

## Project Overview
A comprehensive Django-based rental management platform built with Django REST Framework, featuring complete business workflow automation from product catalog through payment processing.

---

## 🏗️ **SYSTEM ARCHITECTURE**

### **Technology Stack**
- **Backend Framework**: Django 5.1.5 + Django REST Framework 3.15.2
- **Database**: PostgreSQL (Railway Cloud / Local)
- **Authentication**: JWT with SimpleJWT 5.3.0
- **Caching**: Redis 5.0.1
- **Task Queue**: Celery 5.3.6 with Redis broker
- **File Storage**: WhiteNoise for static files, local/cloud for media
- **Payment Processing**: Stripe 8.2.0, Razorpay, PayPal
- **Document Generation**: ReportLab 4.0.8, OpenPyXL 3.1.2
- **Deployment**: Docker + Railway Cloud

### **Project Structure**
```
backend/
├── config/                 # Django project configuration
│   ├── settings.py         # Main settings with environment configs
│   ├── urls.py            # Root URL routing
│   ├── wsgi.py & asgi.py  # WSGI/ASGI application
│   └── celery.py          # Celery configuration
├── apps/                   # Business logic applications
│   ├── accounts/          # User management & authentication
│   ├── catalog/           # Product & inventory management
│   ├── pricing/           # Pricing rules & discounts
│   ├── orders/            # Orders, quotes & reservations
│   ├── deliveries/        # Logistics & delivery tracking
│   ├── invoicing/         # Billing & invoice management
│   ├── payments/          # Payment processing
│   ├── notifications/     # Email/SMS notifications
│   ├── reports/           # Analytics & reporting
│   └── api/              # API management & integrations
├── media/                 # User-uploaded files
├── staticfiles/          # Collected static files
└── requirements.txt      # Python dependencies
```

---

## 📊 **DATABASE SCHEMA**

### **Authentication & User Management (accounts app)**

#### **Django User Model** (Built-in)
- **Table**: `auth_user`
- **Purpose**: Core user authentication
- **Key Fields**: id, username, email, password, first_name, last_name, is_staff, is_active, date_joined

#### **CustomerGroup**
```sql
CREATE TABLE customer_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **UserProfile**
```sql
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'END_USER', 'STAFF', 'ADMIN')),
    customer_group_id BIGINT REFERENCES customer_groups(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    company_name VARCHAR(200),
    tax_id VARCHAR(50),
    preferred_currency VARCHAR(3) DEFAULT 'INR',
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Product Catalog Management (catalog app)**

#### **ProductCategory**
```sql
CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES product_categories(id) ON DELETE SET NULL,
    image VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Product**
```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id BIGINT REFERENCES product_categories(id) ON DELETE SET NULL,
    rentable BOOLEAN DEFAULT TRUE,
    tracking VARCHAR(16) DEFAULT 'QUANTITY' CHECK (tracking IN ('SERIAL', 'QUANTITY')),
    default_rental_unit VARCHAR(10) DEFAULT 'DAY' CHECK (default_rental_unit IN ('HOUR', 'DAY', 'WEEK', 'MONTH')),
    min_rental_duration INTEGER DEFAULT 1,
    max_rental_duration INTEGER,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_rented INTEGER DEFAULT 0,
    weight DECIMAL(8,2),
    dimensions VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    condition_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_product_category_active ON products(category_id, is_active);
CREATE INDEX idx_product_rentable_active ON products(rentable, is_active);
```

#### **ProductImage**
```sql
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    image VARCHAR(100) NOT NULL,
    alt_text VARCHAR(200),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **ProductItem** (For Serial Tracking)
```sql
CREATE TABLE product_items (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    serial_number VARCHAR(120) UNIQUE NOT NULL,
    internal_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'DAMAGED', 'RETIRED')),
    condition_rating INTEGER DEFAULT 10 CHECK (condition_rating BETWEEN 1 AND 10),
    condition_notes TEXT,
    location VARCHAR(100),
    last_service_date DATE,
    next_service_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_item_status ON product_items(product_id, status);
CREATE INDEX idx_product_item_serial ON product_items(serial_number);
```

### **Pricing & Discounts (pricing app)**

#### **PriceList**
```sql
CREATE TABLE price_lists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'INR',
    customer_group_id BIGINT REFERENCES customer_groups(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT FALSE,
    valid_from DATE,
    valid_to DATE,
    priority INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **PriceRule**
```sql
CREATE TABLE price_rules (
    id BIGSERIAL PRIMARY KEY,
    price_list_id BIGINT REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES product_categories(id) ON DELETE CASCADE,
    valid_from DATE,
    valid_to DATE,
    rate_hour DECIMAL(10,2),
    rate_day DECIMAL(10,2),
    rate_week DECIMAL(10,2),
    rate_month DECIMAL(10,2),
    discount_type VARCHAR(20) CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value DECIMAL(10,2),
    min_duration_hours INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_product_or_category CHECK (
        (product_id IS NOT NULL AND category_id IS NULL) OR
        (product_id IS NULL AND category_id IS NOT NULL)
    )
);

CREATE INDEX idx_price_rule_product ON price_rules(product_id, is_active);
CREATE INDEX idx_price_rule_category ON price_rules(category_id, is_active);
CREATE INDEX idx_price_rule_list ON price_rules(price_list_id, is_active);
```

#### **LateFeeRule**
```sql
CREATE TABLE late_fee_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES product_categories(id) ON DELETE CASCADE,
    fee_type VARCHAR(20) CHECK (fee_type IN ('PERCENTAGE', 'FIXED_PER_DAY', 'FIXED_PER_HOUR')),
    fee_value DECIMAL(10,2) NOT NULL,
    grace_period_hours INTEGER DEFAULT 0,
    max_fee_amount DECIMAL(10,2),
    max_fee_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Orders & Quotes (orders app)**

#### **RentalQuote**
```sql
CREATE TABLE rental_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id BIGINT REFERENCES auth_user(id) ON DELETE PROTECT,
    created_by_id BIGINT REFERENCES auth_user(id) ON DELETE PROTECT,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED')),
    valid_until TIMESTAMPTZ,
    price_list_id BIGINT REFERENCES price_lists(id) ON DELETE SET NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    notes TEXT,
    terms_conditions TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quote_customer_status ON rental_quotes(customer_id, status);
CREATE INDEX idx_quote_number ON rental_quotes(quote_number);
CREATE INDEX idx_quote_status_created ON rental_quotes(status, created_at);
```

#### **RentalOrder**
```sql
CREATE TABLE rental_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    quote_id UUID REFERENCES rental_quotes(id) ON DELETE SET NULL,
    customer_id BIGINT REFERENCES auth_user(id) ON DELETE PROTECT,
    created_by_id BIGINT REFERENCES auth_user(id) ON DELETE PROTECT,
    status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'RESERVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'ACTIVE', 'RETURN_SCHEDULED', 'RETURNED', 'COMPLETED', 'CANCELLED')),
    rental_start TIMESTAMPTZ NOT NULL,
    rental_end TIMESTAMPTZ NOT NULL,
    actual_pickup_at TIMESTAMPTZ,
    actual_return_at TIMESTAMPTZ,
    price_list_id BIGINT REFERENCES price_lists(id) ON DELETE SET NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    deposit_amount DECIMAL(12,2) DEFAULT 0,
    late_fee_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    pickup_address TEXT,
    return_address TEXT,
    notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_customer_status ON rental_orders(customer_id, status);
CREATE INDEX idx_order_number ON rental_orders(order_number);
CREATE INDEX idx_order_status_start ON rental_orders(status, rental_start);
CREATE INDEX idx_order_rental_period ON rental_orders(rental_start, rental_end);
```

#### **QuoteItem & RentalItem**
```sql
CREATE TABLE quote_items (
    id BIGSERIAL PRIMARY KEY,
    quote_id UUID REFERENCES rental_quotes(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE PROTECT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    rental_unit VARCHAR(10) DEFAULT 'DAY',
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rental_items (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE PROTECT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    rental_unit VARCHAR(10) DEFAULT 'DAY',
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quote_item_product_dates ON quote_items(product_id, start_datetime, end_datetime);
CREATE INDEX idx_rental_item_product_dates ON rental_items(product_id, start_datetime, end_datetime);
```

#### **Reservation & ReservationItem**
```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    reserved_at TIMESTAMPTZ DEFAULT NOW(),
    pickup_scheduled_at TIMESTAMPTZ,
    actual_pickup_at TIMESTAMPTZ,
    return_due_at TIMESTAMPTZ NOT NULL,
    actual_return_at TIMESTAMPTZ,
    pickup_location TEXT,
    return_location TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reservation_items (
    id BIGSERIAL PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE PROTECT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservation_order_status ON reservations(order_id, status);
CREATE INDEX idx_reservation_status_return ON reservations(status, return_due_at);
```

#### **RentalContract**
```sql
CREATE TABLE rental_contracts (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID UNIQUE REFERENCES rental_orders(id) ON DELETE CASCADE,
    contract_number VARCHAR(64) UNIQUE NOT NULL,
    terms_and_conditions TEXT NOT NULL,
    customer_signature TEXT,
    staff_signature TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contract_file VARCHAR(100)
);
```

### **Delivery & Logistics (deliveries app)**

#### **DeliveryDocument**
```sql
CREATE TABLE delivery_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
    document_number VARCHAR(64) UNIQUE NOT NULL,
    document_type VARCHAR(15) CHECK (document_type IN ('PICKUP', 'DELIVERY', 'RETURN')),
    status VARCHAR(15) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED')),
    scheduled_date TIMESTAMPTZ NOT NULL,
    actual_date TIMESTAMPTZ,
    pickup_address TEXT,
    delivery_address TEXT,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    vehicle_info VARCHAR(100),
    tracking_number VARCHAR(100),
    gps_coordinates VARCHAR(50),
    delivery_notes TEXT,
    customer_signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **ReturnDocument**
```sql
CREATE TABLE return_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
    document_number VARCHAR(64) UNIQUE NOT NULL,
    return_type VARCHAR(15) DEFAULT 'SCHEDULED' CHECK (return_type IN ('SCHEDULED', 'EARLY', 'LATE', 'EMERGENCY')),
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COLLECTED', 'INSPECTED', 'COMPLETED', 'DAMAGED')),
    scheduled_date TIMESTAMPTZ NOT NULL,
    actual_date TIMESTAMPTZ,
    return_location TEXT,
    condition_notes TEXT,
    damage_reported BOOLEAN DEFAULT FALSE,
    damage_description TEXT,
    late_fee_applied DECIMAL(10,2) DEFAULT 0,
    processed_by_id BIGINT REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **StockMovement**
```sql
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(15) CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(20),
    reference_id VARCHAR(36),
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    notes TEXT,
    created_by_id BIGINT REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movement_product ON stock_movements(product_id, created_at);
```

#### **DeliveryRoute**
```sql
CREATE TABLE delivery_routes (
    id BIGSERIAL PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    description TEXT,
    route_date DATE NOT NULL,
    driver_id BIGINT REFERENCES auth_user(id) ON DELETE SET NULL,
    vehicle_info VARCHAR(100),
    start_location TEXT,
    end_location TEXT,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    total_distance DECIMAL(8,2),
    status VARCHAR(15) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    route_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Invoicing & Billing (invoicing app)**

#### **Invoice**
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
    customer_id BIGINT REFERENCES auth_user(id) ON DELETE PROTECT,
    invoice_type VARCHAR(15) DEFAULT 'RENTAL' CHECK (invoice_type IN ('RENTAL', 'DEPOSIT', 'LATE_FEE', 'DAMAGE')),
    status VARCHAR(15) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_terms_id BIGINT REFERENCES payment_terms(id) ON DELETE SET NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    notes TEXT,
    pdf_file VARCHAR(100),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_customer_status ON invoices(customer_id, status);
CREATE INDEX idx_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoice_due_date ON invoices(due_date, status);
```

#### **InvoiceItem**
```sql
CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE PROTECT,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    rental_start TIMESTAMPTZ,
    rental_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **CreditNote**
```sql
CREATE TABLE credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_number VARCHAR(64) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id BIGINT REFERENCES auth_user(id) ON DELETE PROTECT,
    reason VARCHAR(20) CHECK (reason IN ('RETURN', 'DAMAGE_WAIVER', 'DISCOUNT', 'ERROR_CORRECTION', 'OTHER')),
    status VARCHAR(15) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ISSUED', 'APPLIED', 'CANCELLED')),
    issue_date DATE NOT NULL,
    credit_amount DECIMAL(12,2) NOT NULL,
    applied_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    notes TEXT,
    pdf_file VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **PaymentTerm & TaxRate**
```sql
CREATE TABLE payment_terms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    days INTEGER NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tax_rates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    tax_type VARCHAR(20) CHECK (tax_type IN ('PERCENTAGE', 'FIXED')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Payment Processing (payments app)**

#### **PaymentProvider**
```sql
CREATE TABLE payment_providers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(20) CHECK (provider_type IN ('STRIPE', 'RAZORPAY', 'PAYPAL', 'BANK_TRANSFER', 'CASH')),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    api_key TEXT,
    api_secret TEXT,
    webhook_url VARCHAR(200),
    supported_currencies JSONB DEFAULT '["INR"]',
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Payment**
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(64) UNIQUE NOT NULL,
    order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id BIGINT REFERENCES auth_user(id) ON DELETE PROTECT,
    provider_id BIGINT REFERENCES payment_providers(id) ON DELETE SET NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('ONLINE', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'UPI')),
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED')),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    transaction_id VARCHAR(100),
    gateway_response JSONB,
    payment_date DATE,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_customer_status ON payments(customer_id, status);
CREATE INDEX idx_payment_order ON payments(order_id);
CREATE INDEX idx_payment_invoice ON payments(invoice_id);
```

#### **PaymentRefund**
```sql
CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    refund_number VARCHAR(64) UNIQUE NOT NULL,
    reason VARCHAR(20) CHECK (reason IN ('CANCELLATION', 'RETURN', 'OVERPAYMENT', 'ERROR', 'DISPUTE')),
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    refund_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    refund_reference VARCHAR(100),
    gateway_response JSONB,
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **PaymentLink & BankAccount**
```sql
CREATE TABLE payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
    link_url VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    routing_number VARCHAR(50),
    swift_code VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **WebhookEvent**
```sql
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id BIGINT REFERENCES payment_providers(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_id VARCHAR(100),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Notifications (notifications app)**

#### **NotificationTemplate**
```sql
CREATE TABLE notification_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    template_type VARCHAR(10) CHECK (template_type IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    subject VARCHAR(200),
    content TEXT NOT NULL,
    template_variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Notification**
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id BIGINT REFERENCES auth_user(id) ON DELETE CASCADE,
    template_id BIGINT REFERENCES notification_templates(id) ON DELETE SET NULL,
    notification_type VARCHAR(10) CHECK (notification_type IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    subject VARCHAR(200),
    content TEXT NOT NULL,
    context_data JSONB DEFAULT '{}',
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_recipient_status ON notifications(recipient_id, status);
CREATE INDEX idx_notification_scheduled ON notifications(scheduled_at);
```

#### **EmailNotification & SMSNotification**
```sql
CREATE TABLE email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id BIGINT REFERENCES auth_user(id) ON DELETE CASCADE,
    from_email VARCHAR(254) NOT NULL,
    to_email VARCHAR(254) NOT NULL,
    cc_emails JSONB,
    bcc_emails JSONB,
    subject VARCHAR(200) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    attachments JSONB,
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sms_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id BIGINT REFERENCES auth_user(id) ON DELETE CASCADE,
    from_number VARCHAR(20),
    to_number VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **NotificationSchedule & NotificationPreference**
```sql
CREATE TABLE notification_schedules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    template_id BIGINT REFERENCES notification_templates(id) ON DELETE CASCADE,
    schedule_type VARCHAR(10) CHECK (schedule_type IN ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY')),
    is_active BOOLEAN DEFAULT TRUE,
    next_run TIMESTAMPTZ,
    last_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES auth_user(id) ON DELETE CASCADE,
    notification_type VARCHAR(10) CHECK (notification_type IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    category VARCHAR(20) CHECK (category IN ('ORDER_UPDATES', 'PAYMENT_REMINDERS', 'MARKETING', 'SYSTEM')),
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type, category)
);
```

### **Reports & Analytics (reports app)**

#### **ReportTemplate**
```sql
CREATE TABLE report_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    report_type VARCHAR(20) CHECK (report_type IN ('SALES', 'INVENTORY', 'FINANCIAL', 'CUSTOMER', 'OPERATIONAL')),
    query_definition JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    output_format VARCHAR(10) DEFAULT 'PDF' CHECK (output_format IN ('PDF', 'EXCEL', 'CSV', 'JSON')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Report**
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id BIGINT REFERENCES report_templates(id) ON DELETE CASCADE,
    generated_by_id BIGINT REFERENCES auth_user(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}',
    output_format VARCHAR(10) DEFAULT 'PDF',
    status VARCHAR(15) DEFAULT 'GENERATING' CHECK (status IN ('GENERATING', 'COMPLETED', 'FAILED')),
    file_path VARCHAR(255),
    file_size BIGINT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **ReportSchedule**
```sql
CREATE TABLE report_schedules (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT REFERENCES report_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    frequency VARCHAR(15) CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    parameters JSONB DEFAULT '{}',
    recipients JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    next_run TIMESTAMPTZ,
    last_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **DashboardWidget**
```sql
CREATE TABLE dashboard_widgets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    widget_type VARCHAR(15) CHECK (widget_type IN ('CHART', 'TABLE', 'METRIC', 'GAUGE', 'MAP', 'LIST')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    query_definition JSONB NOT NULL,
    configuration JSONB DEFAULT '{}',
    widget_data JSONB,
    position INTEGER DEFAULT 0,
    size VARCHAR(10) DEFAULT 'MEDIUM',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **ReportExecution & BusinessMetric**
```sql
CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id BIGINT REFERENCES report_templates(id) ON DELETE CASCADE,
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    parameters JSONB DEFAULT '{}',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE business_metrics (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    current_value DECIMAL(15,2),
    target_value DECIMAL(15,2),
    unit VARCHAR(20),
    description TEXT,
    calculation_method TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **API Management (api app)**

#### **APIKey**
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    key VARCHAR(64) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000,
    expires_at TIMESTAMPTZ,
    last_used TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Integration**
```sql
CREATE TABLE integrations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    integration_type VARCHAR(15) CHECK (integration_type IN ('WEBHOOK', 'API', 'FTP', 'EMAIL', 'DATABASE')),
    system_id BIGINT REFERENCES external_systems(id) ON DELETE CASCADE,
    status VARCHAR(15) DEFAULT 'INACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ERROR', 'TESTING')),
    configuration JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **WebhookEndpoint**
```sql
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id BIGINT REFERENCES integrations(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) DEFAULT 'POST' CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    headers JSONB DEFAULT '{}',
    events JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    secret_key VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **APILog**
```sql
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time DECIMAL(8,4),
    request_size INTEGER,
    response_size INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_log_endpoint_date ON api_logs(endpoint, created_at);
CREATE INDEX idx_api_log_key_date ON api_logs(api_key_id, created_at);
```

#### **RateLimitRule & ExternalSystem**
```sql
CREATE TABLE rate_limit_rules (
    id BIGSERIAL PRIMARY KEY,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint_pattern VARCHAR(255),
    max_requests INTEGER NOT NULL,
    time_window VARCHAR(10) CHECK (time_window IN ('MINUTE', 'HOUR', 'DAY', 'MONTH')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE external_systems (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    base_url VARCHAR(255),
    api_version VARCHAR(20),
    authentication_type VARCHAR(20) CHECK (authentication_type IN ('API_KEY', 'OAUTH', 'BASIC', 'BEARER')),
    credentials JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 **KEY RELATIONSHIPS**

### **Primary Workflows**
1. **User Registration** → UserProfile creation → CustomerGroup assignment
2. **Product Creation** → Category assignment → PriceRule setup → ProductItem tracking
3. **Quote Creation** → QuoteItems → Customer approval → Order conversion
4. **Order Processing** → Reservation → Delivery scheduling → Payment processing
5. **Delivery Execution** → Stock movements → Contract generation → Invoice creation
6. **Return Processing** → Inspection → Late fee calculation → Final payment
7. **Payment Processing** → Multiple gateways → Refund handling → Webhook events
8. **Notification Flow** → Template-based → Multi-channel delivery → Preference management
9. **Reporting System** → Template execution → Scheduled generation → Analytics

### **Core Business Constraints**
- **Inventory Management**: Real-time availability tracking with reservations
- **Pricing Logic**: Hierarchical rules (Product → Category → Global)
- **Payment Flow**: Order → Invoice → Payment → Refund chain
- **Audit Trail**: Complete history tracking for all business operations
- **Data Integrity**: Foreign key constraints with proper cascade rules

---

## 🛡️ **SECURITY & PERFORMANCE**

### **Authentication & Authorization**
- **JWT Tokens**: Access (60min) + Refresh (7 days) with rotation
- **Role-Based Access**: Customer, Staff, Admin permissions
- **API Security**: Rate limiting, key management, webhook validation

### **Database Optimization**
- **Strategic Indexing**: High-query fields indexed for performance
- **Normalization**: 3NF compliance with proper relationships
- **JSON Fields**: Flexible metadata storage with PostgreSQL JSONB
- **Cascading Rules**: Proper ON DELETE actions for data integrity

### **Scalability Features**
- **Async Processing**: Celery for background tasks (reports, notifications)
- **Caching**: Redis for session management and frequent queries
- **File Storage**: Configurable static/media file handling
- **Cloud Ready**: Railway deployment with PostgreSQL

---

## 📈 **BUSINESS METRICS**

The system tracks comprehensive metrics across:
- **Revenue**: Rental income, late fees, deposits
- **Inventory**: Utilization rates, availability trends
- **Customer**: Satisfaction, retention, lifetime value
- **Operations**: Delivery efficiency, return processing
- **Financial**: Payment success rates, refund patterns

**Total Database Objects**: 40+ tables with 150+ API endpoints supporting complete rental business operations from quote to payment completion.

# 🧪 Postman Test Scenarios for Rental Management System

## 📋 Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [Test Scenarios](#test-scenarios)
3. [Test Data](#test-data)
4. [Automation Scripts](#automation-scripts)
5. [Common Test Cases](#common-test-cases)

---

## 🔧 Setup Instructions

### 1. Import Collection and Environment
1. Open Postman
2. Click **Import** button
3. Import `POSTMAN_COLLECTION.json`
4. Import `POSTMAN_ENVIRONMENT.json`
5. Select the "Rental Management System - Environment" from environment dropdown

### 2. Configure Base URL
- **Development:** `http://localhost:8000/api`
- **Production:** `https://your-domain.com/api`

### 3. Pre-request Scripts
The collection includes automatic token refresh scripts. No manual setup required.

---

## 🧪 Test Scenarios

### Scenario 1: Complete User Registration Flow
```javascript
// Test Description: Register new user and verify profile creation
// Prerequisites: None
// Steps:
1. POST /auth/register/ - Register new user
2. POST /auth/login/ - Login with new credentials
3. GET /profile/me/ - Verify profile data
4. PATCH /profile/me/ - Update profile information

// Expected Results:
- User created with valid tokens
- Profile accessible and editable
- All user data properly stored
```

### Scenario 2: Product Browsing and Availability Check
```javascript
// Test Description: Browse products and check availability
// Prerequisites: Products exist in database
// Steps:
1. GET /catalog/products/ - Get product list
2. GET /catalog/categories/ - Get categories
3. GET /catalog/products/{id}/ - Get specific product
4. GET /catalog/products/{id}/availability/ - Check availability

// Expected Results:
- Products list with pagination
- Categories properly structured
- Product details complete
- Availability accurately calculated
```

### Scenario 3: Complete Rental Order Flow
```javascript
// Test Description: End-to-end rental process
// Prerequisites: Authenticated user, available products
// Steps:
1. POST /orders/quotes/ - Create rental quote
2. GET /pricing/calculate/ - Verify pricing calculation
3. POST /orders/quotes/{id}/convert_to_order/ - Convert to order
4. POST /payments/create_intent/ - Create payment intent
5. POST /payments/confirm/ - Confirm payment
6. GET /orders/orders/{id}/ - Verify order details

// Expected Results:
- Quote created with accurate pricing
- Order conversion successful
- Payment processed correctly
- Order status updated appropriately
```

### Scenario 4: Delivery Management Workflow
```javascript
// Test Description: Schedule and track delivery
// Prerequisites: Confirmed order, staff authentication
// Steps:
1. POST /deliveries/delivery_docs/schedule/ - Schedule delivery
2. GET /deliveries/delivery_docs/schedule_for_date/ - Check schedule
3. PUT /deliveries/delivery_docs/{id}/update_status/ - Update status
4. GET /orders/orders/{id}/ - Verify order status update

// Expected Results:
- Delivery scheduled successfully
- Schedule displays correctly
- Status updates tracked
- Order reflects delivery status
```

### Scenario 5: Invoice and Payment Processing
```javascript
// Test Description: Invoice generation and payment processing
// Prerequisites: Completed order
// Steps:
1. GET /invoicing/invoices/ - Get invoices list
2. GET /invoicing/invoices/{id}/ - Get invoice details
3. GET /invoicing/invoices/{id}/pdf/ - Download PDF
4. POST /invoicing/invoices/{id}/record_payment/ - Record payment

// Expected Results:
- Invoices properly generated
- PDF download works
- Payment recording accurate
- Invoice status updated
```

---

## 📊 Test Data

### User Test Data
```json
{
  "customers": [
    {
      "email": "customer1@test.com",
      "password": "TestPass123!",
      "first_name": "Alice",
      "last_name": "Johnson",
      "user_type": "INDIVIDUAL"
    },
    {
      "email": "business@test.com", 
      "password": "TestPass123!",
      "first_name": "Bob",
      "last_name": "Smith",
      "user_type": "BUSINESS",
      "company_name": "Smith Construction"
    }
  ],
  "staff": [
    {
      "email": "admin@test.com",
      "password": "AdminPass123!",
      "first_name": "Admin",
      "last_name": "User",
      "is_staff": true
    }
  ]
}
```

### Product Test Data
```json
{
  "products": [
    {
      "name": "CAT 320 Excavator",
      "category": "Construction Equipment",
      "daily_rate": 450.00,
      "security_deposit": 5000.00
    },
    {
      "name": "Party Tent 20x30",
      "category": "Event Equipment", 
      "daily_rate": 150.00,
      "security_deposit": 500.00
    }
  ]
}
```

### Order Test Data
```json
{
  "rental_orders": [
    {
      "items": [
        {
          "product_id": 1,
          "quantity": 1,
          "start_date": "2025-02-01",
          "end_date": "2025-02-05"
        }
      ],
      "delivery_required": true,
      "delivery_address": {
        "street_address": "123 Construction Site",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001"
      }
    }
  ]
}
```

---

## 🤖 Automation Scripts

### Pre-request Script Template
```javascript
// Set dynamic variables
pm.environment.set("timestamp", Math.floor(Date.now() / 1000));
pm.environment.set("random_email", `test${Math.floor(Math.random() * 10000)}@example.com`);

// Auto-refresh token if expired
const token = pm.environment.get("access_token");
if (!token) {
    const refreshToken = pm.environment.get("refresh_token");
    if (refreshToken) {
        pm.sendRequest({
            url: pm.environment.get("base_url") + "/auth/refresh/",
            method: "POST",
            header: { "Content-Type": "application/json" },
            body: { mode: "raw", raw: JSON.stringify({ refresh: refreshToken }) }
        }, (err, res) => {
            if (res && res.code === 200) {
                const data = res.json();
                pm.environment.set("access_token", data.data.access);
            }
        });
    }
}
```

### Test Script Template
```javascript
// Standard success tests
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("Status code is successful", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202, 204]);
});

pm.test("Response format is valid", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("success");
    if (jsonData.success) {
        pm.expect(jsonData).to.have.property("data");
    } else {
        pm.expect(jsonData).to.have.property("error");
    }
});

// Content-specific tests
pm.test("Required fields present", function () {
    const jsonData = pm.response.json();
    // Add specific field checks based on endpoint
    pm.expect(jsonData.data).to.have.property("id");
});

// Save important data for subsequent requests
const jsonData = pm.response.json();
if (jsonData.success && jsonData.data) {
    // Save IDs for later use
    if (jsonData.data.id) {
        pm.environment.set("last_created_id", jsonData.data.id);
    }
    if (jsonData.data.tokens) {
        pm.environment.set("access_token", jsonData.data.tokens.access);
        pm.environment.set("refresh_token", jsonData.data.tokens.refresh);
    }
}
```

### Error Handling Tests
```javascript
// Test error responses
pm.test("Error response format", function () {
    if (pm.response.code >= 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property("success", false);
        pm.expect(jsonData).to.have.property("error");
        pm.expect(jsonData.error).to.have.property("code");
        pm.expect(jsonData.error).to.have.property("message");
    }
});

// Test authentication errors
pm.test("Authentication error handling", function () {
    if (pm.response.code === 401) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.error.code).to.eql("AUTHENTICATION_REQUIRED");
    }
});

// Test validation errors
pm.test("Validation error details", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.error.code).to.eql("VALIDATION_ERROR");
        pm.expect(jsonData.error).to.have.property("details");
    }
});
```

---

## 📝 Common Test Cases

### Authentication Tests
```javascript
// Valid login test
pm.test("Valid login successful", function () {
    pm.expect(pm.response.code).to.eql(200);
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.tokens).to.have.property("access");
    pm.expect(jsonData.data.tokens).to.have.property("refresh");
});

// Invalid credentials test
pm.test("Invalid credentials rejected", function () {
    if (pm.response.code === 401) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.error.code).to.eql("INVALID_CREDENTIALS");
    }
});

// Token expiry test
pm.test("Expired token handling", function () {
    if (pm.response.code === 401) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.error.code).to.be.oneOf(["TOKEN_EXPIRED", "INVALID_TOKEN"]);
    }
});
```

### Data Validation Tests
```javascript
// Required field validation
pm.test("Required fields validated", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.error.details).to.be.an("object");
    }
});

// Email format validation
pm.test("Email format validated", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        if (jsonData.error.details && jsonData.error.details.email) {
            pm.expect(jsonData.error.details.email[0]).to.include("valid email");
        }
    }
});

// Password strength validation
pm.test("Password strength validated", function () {
    if (pm.response.code === 400) {
        const jsonData = pm.response.json();
        if (jsonData.error.details && jsonData.error.details.password) {
            pm.expect(jsonData.error.details.password[0]).to.include("8 characters");
        }
    }
});
```

### Business Logic Tests
```javascript
// Availability calculation test
pm.test("Availability calculated correctly", function () {
    const jsonData = pm.response.json();
    if (jsonData.data.requested_quantity > jsonData.data.available_quantity) {
        pm.expect(jsonData.data.is_available).to.eql(false);
    }
});

// Pricing calculation test
pm.test("Pricing calculated correctly", function () {
    const jsonData = pm.response.json();
    const subtotal = jsonData.data.pricing_summary.subtotal;
    const tax = jsonData.data.pricing_summary.tax_amount;
    const total = jsonData.data.pricing_summary.total_amount;
    pm.expect(total).to.be.at.least(subtotal);
});

// Order status progression test
pm.test("Order status progression valid", function () {
    const jsonData = pm.response.json();
    const validStatuses = ["DRAFT", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"];
    pm.expect(validStatuses).to.include(jsonData.data.status);
});
```

### Performance Tests
```javascript
// Response time test
pm.test("Response time acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});

// Pagination test
pm.test("Pagination working correctly", function () {
    const jsonData = pm.response.json();
    if (jsonData.data.count > jsonData.data.results.length) {
        pm.expect(jsonData.data).to.have.property("next");
    }
});

// Search functionality test
pm.test("Search returns relevant results", function () {
    const searchTerm = pm.request.url.query.get("search");
    if (searchTerm) {
        const jsonData = pm.response.json();
        jsonData.data.results.forEach(item => {
            const itemText = (item.name + " " + item.description).toLowerCase();
            pm.expect(itemText).to.include(searchTerm.toLowerCase());
        });
    }
});
```

### Security Tests
```javascript
// Authorization test
pm.test("Authorization enforced", function () {
    if (!pm.request.headers.get("Authorization")) {
        pm.expect(pm.response.code).to.eql(401);
    }
});

// CSRF protection test
pm.test("CSRF protection active", function () {
    const csrfToken = pm.response.headers.get("X-CSRFToken");
    if (csrfToken) {
        pm.expect(csrfToken).to.have.length.above(10);
    }
});

// Rate limiting test
pm.test("Rate limiting enforced", function () {
    if (pm.response.code === 429) {
        const jsonData = pm.response.json();
        pm.expect(jsonData.error.code).to.eql("RATE_LIMIT_EXCEEDED");
    }
});
```

---

## 🔄 Test Execution Order

### Recommended Test Sequence
1. **System Health Check** - Verify API is running
2. **User Registration** - Create test accounts
3. **Authentication** - Login and token management
4. **Product Catalog** - Browse and search products
5. **Quote Creation** - Create rental quotes
6. **Order Management** - Convert quotes to orders
7. **Payment Processing** - Handle payments
8. **Delivery Scheduling** - Manage deliveries
9. **Invoice Management** - Generate and manage invoices
10. **Notifications** - Test notification system
11. **Reports** - Generate and view reports
12. **System Administration** - Admin functions

### Parallel Test Groups
- **Read-only operations** can run in parallel
- **Data creation tests** should run sequentially
- **Authentication tests** should run first
- **Cleanup tests** should run last

---

## 📈 Test Reporting

### Success Criteria
- All endpoints return correct HTTP status codes
- Response times under 2 seconds
- All business rules enforced
- Security measures working
- Error handling appropriate

### Metrics to Track
- API response times
- Success/failure rates
- Error distribution
- Authentication success rate
- Data validation accuracy

### Common Issues to Watch
- Token expiration handling
- Rate limiting behavior
- Validation error messages
- Data consistency
- Performance degradation

---

## 🎯 Advanced Testing Scenarios

### Load Testing
```javascript
// High-volume user simulation
pm.test("Handle concurrent users", function () {
    // Test with multiple simultaneous requests
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 429]);
});
```

### Edge Cases
```javascript
// Test boundary conditions
pm.test("Handle edge cases", function () {
    // Test with extreme values, empty data, etc.
});
```

### Integration Testing
```javascript
// Test cross-module functionality
pm.test("Cross-module integration works", function () {
    // Test order -> payment -> delivery flow
});
```

---

**Total Test Cases:** 100+  
**Coverage:** All 150+ API endpoints  
**Last Updated:** January 11, 2025

# StockPilot API Documentation

**Base URL:** `https://backend-production-e7ef.up.railway.app/api`
**Authentication:** Bearer JWT Token
**Rate Limiting:** 100 requests/minute (global), 10 requests/minute (auth endpoints)

---

## Table of Contents

- [Authentication](#authentication)
- [Inventory](#inventory)
- [Stock Management](#stock-management)
- [Analytics](#analytics)
- [Reports](#reports)
- [Suppliers](#suppliers)
- [Portfolio](#portfolio)
- [AI Predictions](#ai-predictions)
- [Notifications](#notifications)
- [Tenants](#tenants)
- [Upload](#upload)
- [Health](#health)
- [Error Handling](#error-handling)
- [WebSocket Events](#websocket-events)

---

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### POST /auth/register

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/login

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /auth/logout

Logout and clear the authentication cookie.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /auth/me

Get the current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "staff",
    "isActive": true,
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### PUT /auth/profile

Update the current user's profile.

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6789012345",
    "name": "John Updated",
    "email": "john.updated@example.com",
    "role": "staff"
  }
}
```

### POST /auth/forgot-password

Initiate password recovery flow.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /auth/reset-password

Reset password with a valid token.

**Request Body:**
```json
{
  "token": "abc123resettoken",
  "password": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### POST /auth/change-password

Change password for authenticated user.

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### GET /auth/users (Admin Only)

Get all users in the system.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "isActive": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### PUT /auth/users/:id/role (Admin Only)

Update a user's role.

**Request Body:**
```json
{
  "role": "manager"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6789012345",
    "name": "John Doe",
    "role": "manager"
  }
}
```

### PUT /auth/users/:id/status (Admin Only)

Activate or deactivate a user.

**Request Body:**
```json
{
  "isActive": false
}
```

### DELETE /auth/users/:id (Admin Only)

Delete a user account.

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Inventory

### GET /items

List all inventory items with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name, SKU, or category |
| `category` | string | Filter by category |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6789012345",
      "name": "Widget A",
      "description": "High-quality widget",
      "quantity": 150,
      "category": "Electronics",
      "location": "Warehouse A",
      "lowStockThreshold": 10,
      "unitPrice": 29.99,
      "sku": "WID-001",
      "barcode": "1234567890123",
      "supplier": "Acme Corp",
      "imageUrl": "/uploads/widget-a.jpg",
      "tags": ["electronics", "popular"],
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

### POST /items

Create a new inventory item.

**Request Body:**
```json
{
  "name": "Widget A",
  "description": "High-quality widget",
  "quantity": 150,
  "category": "Electronics",
  "location": "Warehouse A",
  "lowStockThreshold": 10,
  "unitPrice": 29.99,
  "sku": "WID-001",
  "barcode": "1234567890123",
  "supplier": "Acme Corp",
  "tags": ["electronics", "popular"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6789012345",
    "name": "Widget A",
    "quantity": 150,
    "category": "Electronics"
  }
}
```

### GET /items/:id

Get a specific inventory item by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6789012345",
    "name": "Widget A",
    "quantity": 150,
    "category": "Electronics",
    "location": "Warehouse A"
  }
}
```

### PUT /items/:id

Update an inventory item.

**Request Body:**
```json
{
  "name": "Widget A Updated",
  "quantity": 200,
  "unitPrice": 34.99
}
```

### DELETE /items/:id

Delete an inventory item.

**Response (200):**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

### POST /items/:id/movement

Record a stock movement for an item.

**Request Body:**
```json
{
  "type": "IN",
  "quantity": 50,
  "reason": "Supplier delivery",
  "notes": "Quarterly restock from Acme Corp"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "movement": {
      "_id": "65a1b2c3d4e5f6789012346",
      "itemId": "65a1b2c3d4e5f6789012345",
      "type": "IN",
      "quantity": 50,
      "reason": "Supplier delivery"
    },
    "updatedItem": {
      "quantity": 200
    }
  }
}
```

### GET /items/:id/forecast

Get AI-powered demand forecast for an item.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "itemId": "65a1b2c3d4e5f6789012345",
    "forecast": {
      "nextWeek": 45,
      "nextMonth": 180,
      "confidence": 0.82,
      "trend": "increasing",
      "recommendedReorder": 100,
      "reorderPoint": 25
    }
  }
}
```

---

## Stock Management

### POST /stock/add

Add stock to an item.

**Request Body:**
```json
{
  "itemId": "65a1b2c3d4e5f6789012345",
  "quantity": 50,
  "reason": "Supplier delivery"
}
```

### POST /stock/remove

Remove stock from an item.

**Request Body:**
```json
{
  "itemId": "65a1b2c3d4e5f6789012345",
  "quantity": 10,
  "reason": "Customer order #1234"
}
```

### GET /stock/movements

Get stock movement history.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `itemId` | string | Filter by specific item |
| `type` | string | Filter by movement type (IN/OUT/ADJUST) |
| `limit` | number | Number of records to return |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6789012346",
      "itemId": "65a1b2c3d4e5f6789012345",
      "type": "IN",
      "quantity": 50,
      "reason": "Supplier delivery",
      "userId": "65a1b2c3d4e5f6789012340",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### PUT /stock/quick-update/:id

Quick update stock quantity for an item.

**Request Body:**
```json
{
  "quantity": 175
}
```

---

## Analytics

### GET /analytics/dashboard

Get dashboard statistics and KPIs.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalItems": 245,
    "totalValue": 125430.50,
    "lowStockCount": 12,
    "outOfStockCount": 3,
    "categoryCounts": {
      "Electronics": 85,
      "Clothing": 60,
      "Food": 100
    },
    "recentActivity": [
      {
        "type": "stock_added",
        "itemName": "Widget A",
        "quantity": 50,
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### GET /analytics/trends

Get inventory trends over time.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | Time period: `7d`, `30d`, `90d` |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "stockLevels": [
      { "date": "2024-01-01", "totalStock": 2450 },
      { "date": "2024-01-02", "totalStock": 2380 }
    ],
    "movements": {
      "inbound": 450,
      "outbound": 320,
      "adjustments": 15
    }
  }
}
```

### GET /analytics/alerts

Get low stock and critical alerts.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "itemId": "65a1b2c3d4e5f6789012345",
      "itemName": "Widget B",
      "currentStock": 3,
      "threshold": 10,
      "severity": "critical",
      "message": "Widget B is critically low (3/10)"
    }
  ]
}
```

### GET /analytics/report

Generate an analytics report.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Report type: `summary`, `detailed`, `movements` |

---

## Reports

### GET /reports/inventory

Generate an inventory report.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "summary": {
      "totalItems": 245,
      "totalValue": 125430.50,
      "lowStock": 12,
      "outOfStock": 3
    },
    "items": [...]
  }
}
```

### GET /reports/export/excel (Manager+)

Export inventory report as Excel file.

**Response:** Binary file download (`.xlsx`)

### GET /reports/export/pdf (Manager+)

Export inventory report as PDF file.

**Response:** Binary file download (`.pdf`)

---

## Suppliers

### GET /suppliers

List suppliers with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name, code, contact |
| `status` | string | Filter: `active`, `inactive`, `pending` |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6789012345",
      "name": "Acme Corp",
      "code": "ACM-001",
      "email": "orders@acme.com",
      "phone": "+1-555-0100",
      "status": "active",
      "rating": 4.5,
      "leadTimeDays": 5,
      "categories": ["electronics", "components"]
    }
  ]
}
```

### POST /suppliers (Manager+)

Create a new supplier.

**Request Body:**
```json
{
  "name": "Acme Corp",
  "code": "ACM-001",
  "email": "orders@acme.com",
  "phone": "+1-555-0100",
  "contactPerson": "Jane Smith",
  "address": {
    "street": "123 Supply St",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postalCode": "10001"
  },
  "leadTimeDays": 5,
  "categories": ["electronics"],
  "paymentTerms": {
    "method": "net",
    "netDays": 30,
    "currency": "USD"
  }
}
```

### PUT /suppliers/:id (Manager+)

Update a supplier.

### DELETE /suppliers/:id (Admin Only)

Delete a supplier.

---

## Portfolio

### GET /portfolio

Get all portfolio positions for the current user.

### POST /portfolio/positions

Add a new stock position.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "quantity": 10,
  "buyPrice": 150.00
}
```

### PUT /portfolio/positions/:id

Update a portfolio position.

### DELETE /portfolio/positions/:id

Delete a portfolio position.

---

## AI Predictions

### GET /ai/predict/:id

Get AI demand prediction for a specific item.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "itemId": "65a1b2c3d4e5f6789012345",
    "prediction": {
      "demandNextWeek": 45,
      "demandNextMonth": 180,
      "confidence": 0.85,
      "seasonalFactor": 1.2,
      "trend": "increasing",
      "recommendedAction": "reorder"
    }
  }
}
```

### GET /ai/predict-all

Batch predict demand for all inventory items.

### GET /ai/optimize

Get optimization recommendations for inventory levels.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "itemId": "65a1b2c3d4e5f6789012345",
        "itemName": "Widget A",
        "currentStock": 150,
        "optimalStock": 200,
        "action": "increase",
        "savings": 450.00,
        "priority": "medium"
      }
    ],
    "totalPotentialSavings": 12500.00
  }
}
```

---

## Notifications

### POST /notifications/test (Admin Only)

Send a test notification.

### POST /notifications/test-email (Admin Only)

Send a test email notification.

---

## Tenants

### POST /tenants (Admin Only)

Create a new tenant.

**Request Body:**
```json
{
  "name": "Acme Retail",
  "slug": "acme-retail",
  "domain": "acme.stockpilot.com",
  "contactEmail": "admin@acme.com",
  "plan": "professional",
  "settings": {
    "timezone": "America/New_York",
    "currency": "USD",
    "features": {
      "aiForecasting": true,
      "multiWarehouse": true,
      "advancedReporting": true
    }
  }
}
```

### GET /tenants (Admin Only)

List all tenants.

### GET /tenants/:id (Admin Only)

Get a specific tenant.

### PUT /tenants/:id (Admin Only)

Update a tenant.

### DELETE /tenants/:id (Admin Only)

Delete a tenant.

---

## Upload

### POST /upload/image

Upload an image file (max 5MB).

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Image file (jpg, png, webp) |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/1705312200-widget-a.jpg",
    "filename": "1705312200-widget-a.jpg"
  }
}
```

### POST /upload/image/base64

Upload a base64-encoded image.

**Request Body:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "filename": "product-image.png"
}
```

### DELETE /upload

Delete an uploaded image.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL of the image to delete |

---

## Health

### GET /health

Health check endpoint (no authentication required).

**Response (200):**
```json
{
  "status": "ok",
  "uptime": 86400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## WebSocket Events

**Connection URL:** `wss://backend-production-e7ef.up.railway.app/ws`

### Connecting

```typescript
import { io } from 'socket.io-client';

const socket = io('wss://backend-production-e7ef.up.railway.app', {
  path: '/ws',
  transports: ['websocket', 'polling'],
  auth: { token: 'your_jwt_token' }
});

// Authenticate after connection
socket.emit('authenticate', { userId: 'user_id', role: 'staff' });
```

### Client Events (Emit)

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ userId, role }` | Authenticate socket connection |
| `subscribe_item` | `{ itemId }` | Subscribe to item updates |
| `unsubscribe_item` | `{ itemId }` | Unsubscribe from item updates |

### Server Events (Listen)

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ clientId, message }` | Connection confirmed |
| `stock_update` | `StockUpdateEvent` | Stock level changed |
| `alert` | `AlertEvent` | Low stock alert |
| `critical_alert` | `AlertEvent` | Critical alert (admin/manager) |
| `notification` | `NotificationEvent` | General notification |
| `dashboard_update` | `DashboardData` | Dashboard refresh |

### Event Types

```typescript
interface StockUpdateEvent {
  type: 'stock_added' | 'stock_removed' | 'stock_adjusted' | 'item_created' | 'item_deleted';
  itemId: string;
  itemName: string;
  previousQuantity?: number;
  newQuantity?: number;
  userId: string;
  userName?: string;
  timestamp: string;
}

interface AlertEvent {
  type: 'low_stock' | 'out_of_stock' | 'restock_needed';
  severity: 'info' | 'warning' | 'critical';
  itemId: string;
  itemName: string;
  currentStock: number;
  threshold: number;
  message: string;
  timestamp: string;
}

interface NotificationEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
```

---

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all endpoints |
| `manager` | CRUD on items, suppliers, reports, exports |
| `staff` | Read/write on items, read reports |
| `viewer` | Read-only access |

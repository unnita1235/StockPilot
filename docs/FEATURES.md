# StockPilot Features Documentation

## Table of Contents
- [Authentication](#authentication)
- [Real-time Notifications](#real-time-notifications)
- [Email Alerts](#email-alerts)
- [Multi-Tenancy](#multi-tenancy)
- [API Reference](#api-reference)

---

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "User Name",
      "email": "user@example.com",
      "role": "admin|manager|staff|viewer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### Using the Token
Include the JWT token in all authenticated requests:
```http
Authorization: Bearer <token>
```

---

## Real-time Notifications

StockPilot uses WebSocket (Socket.IO) for real-time updates.

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('https://backend-production-e7ef.up.railway.app/ws', {
  withCredentials: true,
});

// Authenticate after connecting
socket.emit('authenticate', { userId: 'user_id', role: 'admin' });
```

### Events

#### Stock Updates
Emitted when inventory changes:
```javascript
socket.on('stock_update', (event) => {
  // event: {
  //   type: 'stock_added' | 'stock_removed' | 'stock_adjusted',
  //   itemId: string,
  //   itemName: string,
  //   previousQuantity: number,
  //   newQuantity: number,
  //   userId: string,
  //   timestamp: string
  // }
});
```

#### Alerts
Emitted for low stock warnings:
```javascript
socket.on('alert', (event) => {
  // event: {
  //   type: 'low_stock' | 'out_of_stock',
  //   severity: 'warning' | 'critical',
  //   itemId: string,
  //   itemName: string,
  //   currentStock: number,
  //   threshold: number,
  //   message: string,
  //   timestamp: string
  // }
});
```

#### Notifications
General notifications:
```javascript
socket.on('notification', (event) => {
  // event: {
  //   id: string,
  //   type: 'info' | 'success' | 'warning' | 'error',
  //   title: string,
  //   message: string,
  //   timestamp: string,
  //   read: boolean
  // }
});
```

### Subscribing to Specific Items
```javascript
// Subscribe to updates for a specific item
socket.emit('subscribe_item', 'item_id');

// Receive item-specific updates
socket.on('item_stock_update', (event) => {
  // Updates for subscribed item only
});

// Unsubscribe
socket.emit('unsubscribe_item', 'item_id');
```

---

## Email Alerts

StockPilot sends automated email alerts for critical inventory situations.

### Configuration
Set the following environment variable:
```
RESEND_API_KEY=re_your_api_key
```

### Alert Types

#### Critical Low Stock Alert
Sent immediately when an item reaches **zero stock**:
- Subject: `🚨 URGENT: [Item Name] is OUT OF STOCK`
- Beautiful HTML template with item details
- Direct link to view item in dashboard

#### Low Stock Warning
Sent when stock drops below threshold:
- Subject: `⚠️ Low Stock Alert: [Item Name]`
- Current stock level and threshold
- Action button to manage inventory

#### Daily Summary
Administrators receive a daily summary of all low stock items:
- List of all items below threshold
- Quick overview for restocking decisions

### Email Template Preview

```
┌─────────────────────────────────────┐
│     🚨 OUT OF STOCK                 │
│     (Red header for critical)       │
├─────────────────────────────────────┤
│                                     │
│  Widget Pro X                       │
│                                     │
│  Current Stock:  0 units            │
│  Threshold:      10 units           │
│                                     │
│  [  View Item Details  ]            │
│                                     │
├─────────────────────────────────────┤
│  Automated alert from StockPilot    │
└─────────────────────────────────────┘
```

---

## Multi-Tenancy

StockPilot supports multiple organizations (tenants) on a single deployment.

### How It Works
1. Each tenant has isolated data (inventory, users, movements)
2. Tenant is identified by subdomain or header
3. All queries automatically filter by tenant

### Tenant Identification

#### Option 1: Subdomain
```
https://acme.stockpilot.com  → tenant: acme
https://globex.stockpilot.com → tenant: globex
```

#### Option 2: Header
```http
X-Tenant-Id: acme
```

### Data Isolation
All models include `tenantId`:
- `Inventory` - Items belong to a tenant
- `User` - Users belong to a tenant
- `StockMovement` - Movements are tenant-scoped

### Default Tenant
In development mode, a "default" tenant is auto-created if none exists.

---

## API Reference

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List all items |
| POST | `/api/items` | Create item |
| GET | `/api/items/:id` | Get item by ID |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |

### Stock Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stock/add` | Add stock |
| POST | `/api/stock/remove` | Remove stock |
| PUT | `/api/stock/quick-update/:id` | Quick update stock |
| GET | `/api/stock/movements` | Get movement history |

#### Add Stock
```http
POST /api/stock/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "item_id",
  "quantity": 50,
  "reason": "Restock from supplier",
  "notes": "Order #12345"
}
```

#### Remove Stock
```http
POST /api/stock/remove
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "item_id",
  "quantity": 10,
  "reason": "Customer order",
  "notes": "Invoice #67890"
}
```

#### Quick Update
```http
PUT /api/stock/quick-update/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "stock": 100
}
```

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/trends` | Stock trends |
| GET | `/api/analytics/alerts` | Active alerts |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/inventory` | Inventory report |
| GET | `/api/reports/export/excel` | Export to Excel |
| GET | `/api/reports/export/pdf` | Export to PDF |

---

## Environment Variables

### Required
```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secure_secret
```

### Optional
```bash
# Email notifications
RESEND_API_KEY=re_xxx

# Frontend URL (for CORS and email links)
FRONTEND_URL=https://your-frontend.com

# SMS notifications (future)
TWILIO_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE=+1234567890
```

---

## Deployment

### Production Stack
- **Backend**: Railway (`backend-production-e7ef.up.railway.app`)
- **Frontend**: Vercel (`stock-pilot-wheat.vercel.app`)
- **Database**: MongoDB Atlas

### Local Development
```bash
# Using Docker
docker-compose up

# Or manually
cd backend && npm run start:dev
cd .. && npm run dev
```

---

## Support

For issues or feature requests, please create a GitHub issue.

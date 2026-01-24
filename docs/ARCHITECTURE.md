# StockPilot System Architecture

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [Database Design](#database-design)
- [Authentication Flow](#authentication-flow)
- [WebSocket Architecture](#websocket-architecture)
- [Multi-Tenancy](#multi-tenancy)
- [Security Architecture](#security-architecture)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Next.js 15 Frontend<br/>React 18 + TypeScript]
    end

    subgraph "API Layer"
        B[NestJS Backend<br/>Express + TypeScript]
        C[WebSocket Gateway<br/>Socket.IO]
    end

    subgraph "Data Layer"
        D[(MongoDB Atlas<br/>Document Store)]
    end

    subgraph "Infrastructure"
        E[Vercel<br/>Frontend Hosting]
        F[Railway<br/>Backend Hosting]
    end

    A -->|REST API| B
    A <-->|WebSocket| C
    B --> D
    C --> D
    A -.->|Deployed on| E
    B -.->|Deployed on| F
    C -.->|Deployed on| F
```

---

## Frontend Architecture

```mermaid
graph TB
    subgraph "Next.js App Router"
        A[Layout + Providers]
        B[Pages]
        C[API Routes]
    end

    subgraph "Component Layer"
        D[UI Components<br/>Radix UI + Tailwind]
        E[Domain Components<br/>Inventory, Dashboard]
        F[Layout Components<br/>DashboardLayout, ProtectedRoute]
    end

    subgraph "State & Data"
        G[AuthContext<br/>Global Auth State]
        H[Custom Hooks<br/>useInventory, useWebSocket]
        I[API Client<br/>Fetch + Error Handling]
    end

    subgraph "External"
        J[Backend API]
        K[WebSocket Server]
    end

    A --> B
    B --> D
    B --> E
    B --> F
    E --> H
    H --> I
    I --> J
    H --> K
    G --> F
```

### Frontend Directory Structure

```
src/
├── app/                    # Next.js App Router (pages)
│   ├── page.tsx           # Dashboard (main inventory view)
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── login/             # Authentication pages
│   ├── register/
│   ├── admin/users/       # Admin panel
│   ├── reports/           # Analytics & reports
│   └── settings/          # User settings
├── components/
│   ├── ui/                # 40+ Radix UI primitives
│   └── inventory/         # Domain-specific components
├── contexts/
│   └── auth-context.tsx   # JWT auth state management
├── hooks/                 # Custom React hooks
│   ├── use-websocket.ts   # Real-time updates
│   ├── use-inventory.ts   # Inventory CRUD
│   └── use-dashboard.ts   # Dashboard data
└── lib/                   # Utilities
    ├── api-client.ts      # HTTP client with auth
    ├── config.ts          # Environment configuration
    └── socket.ts          # WebSocket connection
```

### Key Frontend Patterns

- **Server Components**: Used for layout and static content
- **Client Components**: Used for interactive features (forms, real-time data)
- **Protected Routes**: `ProtectedRoute` component wraps authenticated pages
- **Error Boundaries**: Graceful error handling at page level
- **Optimistic Updates**: UI updates before server confirmation
- **Real-time Sync**: WebSocket-driven state updates

---

## Backend Architecture

```mermaid
graph TB
    subgraph "API Gateway"
        A[Express + Helmet<br/>Rate Limiting + CORS]
    end

    subgraph "NestJS Modules"
        B[AuthModule<br/>JWT + Passport]
        C[InventoryModule<br/>CRUD + Movements]
        D[StockModule<br/>Stock Operations]
        E[AnalyticsModule<br/>Dashboard + Trends]
        F[ReportsModule<br/>Excel + PDF Export]
        G[AIModule<br/>Demand Prediction]
        H[SuppliersModule<br/>Supplier Management]
        I[WebSocketModule<br/>Real-time Events]
        J[TenantModule<br/>Multi-tenancy]
        K[AuditModule<br/>Activity Logging]
        L[UploadModule<br/>File Management]
        M[NotificationsModule<br/>Email + SMS]
    end

    subgraph "Data Access"
        N[Mongoose ODM<br/>Schemas + Validation]
        O[Tenant Isolation Plugin<br/>Auto-filter by tenantId]
    end

    subgraph "Database"
        P[(MongoDB Atlas)]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    A --> K
    A --> L
    A --> M
    B --> N
    C --> N
    D --> N
    E --> N
    N --> O
    O --> P
```

### Backend Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| **AuthModule** | User registration, login, JWT tokens, RBAC |
| **InventoryModule** | Item CRUD, stock movements, forecasting |
| **StockModule** | Stock add/remove/adjust operations |
| **AnalyticsModule** | Dashboard KPIs, trends, alerts |
| **ReportsModule** | Report generation, Excel/PDF export |
| **AIModule** | Demand prediction, optimization |
| **SuppliersModule** | Supplier CRUD, search, filtering |
| **WebSocketModule** | Real-time events broadcasting |
| **TenantModule** | Multi-tenant management |
| **AuditModule** | Activity logging, audit trail |
| **UploadModule** | Image upload and management |
| **NotificationsModule** | Email/SMS notifications |

---

## Data Flow

### Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant G as Guard
    participant CT as Controller
    participant S as Service
    participant DB as MongoDB

    C->>M: HTTP Request
    M->>M: Tenant Resolution
    M->>M: Rate Limiting
    M->>G: Pass to Guards
    G->>G: JWT Validation
    G->>G: Role Check
    G->>CT: Authorized Request
    CT->>CT: DTO Validation
    CT->>S: Business Logic
    S->>DB: Database Query
    DB-->>S: Result
    S-->>CT: Processed Data
    CT-->>C: JSON Response
```

### Real-time Update Flow

```mermaid
sequenceDiagram
    participant U1 as User A
    participant API as Backend API
    participant WS as WebSocket Gateway
    participant U2 as User B
    participant U3 as Admin

    U1->>API: POST /stock/add
    API->>API: Update Database
    API->>WS: Broadcast Event
    WS->>U1: stock_update
    WS->>U2: stock_update
    WS->>U3: stock_update + alert (if low stock)
```

---

## Database Design

```mermaid
erDiagram
    TENANT ||--o{ USER : contains
    TENANT ||--o{ INVENTORY : contains
    USER ||--o{ STOCK_MOVEMENT : creates
    INVENTORY ||--o{ STOCK_MOVEMENT : tracks
    USER ||--o{ POSITION : owns
    USER ||--o{ AUDIT_LOG : generates
    TENANT ||--o{ SUPPLIER : manages

    TENANT {
        ObjectId _id
        String name
        String slug
        String domain
        String plan
        String status
        Object settings
    }

    USER {
        ObjectId _id
        ObjectId tenantId
        String name
        String email
        String password
        String role
        Boolean isActive
        Date lastLoginAt
    }

    INVENTORY {
        ObjectId _id
        ObjectId tenantId
        String name
        String description
        Number quantity
        String category
        String location
        Number lowStockThreshold
        Number unitPrice
        String sku
        String supplier
    }

    STOCK_MOVEMENT {
        ObjectId _id
        ObjectId tenantId
        ObjectId itemId
        String type
        Number quantity
        String reason
        ObjectId userId
    }

    SUPPLIER {
        ObjectId _id
        String name
        String code
        String email
        String status
        Number rating
        Number leadTimeDays
    }

    POSITION {
        ObjectId _id
        ObjectId userId
        String symbol
        Number quantity
        Number buyPrice
    }

    AUDIT_LOG {
        ObjectId _id
        String tenantId
        String userId
        String action
        String entity
        Object oldValue
        Object newValue
    }
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB

    Note over C,DB: Registration Flow
    C->>F: Fill registration form
    F->>B: POST /api/auth/register
    B->>DB: Check email uniqueness
    B->>DB: Create user (bcrypt hash)
    B->>B: Generate JWT (7d expiry)
    B-->>F: { user, token }
    F->>F: Store token, set AuthContext
    F-->>C: Redirect to dashboard

    Note over C,DB: Login Flow
    C->>F: Enter credentials
    F->>B: POST /api/auth/login
    B->>DB: Find user by email
    B->>B: Verify bcrypt password
    B->>B: Generate JWT
    B-->>F: { user, token } + httpOnly cookie
    F->>F: Store token, set AuthContext

    Note over C,DB: Protected Request
    C->>F: Access protected page
    F->>B: GET /api/items (Bearer token)
    B->>B: Extract JWT from header
    B->>B: Verify JWT signature
    B->>DB: Validate user exists
    B-->>F: { data: [...items] }
```

### Role-Based Access Control

```mermaid
graph LR
    A[admin] -->|Full Access| B[All Endpoints]
    C[manager] -->|CRUD + Export| D[Items, Suppliers, Reports]
    E[staff] -->|Read/Write| F[Items, Basic Reports]
    G[viewer] -->|Read Only| H[Dashboard, Items List]
```

---

## WebSocket Architecture

```mermaid
graph TB
    subgraph "WebSocket Gateway"
        A[Socket.IO Server<br/>/ws namespace]
        B[Connection Manager<br/>Client tracking]
        C[Room Manager<br/>User/Role/Item rooms]
    end

    subgraph "Event Types"
        D[stock_update<br/>Inventory changes]
        E[alert<br/>Low stock warnings]
        F[critical_alert<br/>Admin/Manager only]
        G[notification<br/>General messages]
        H[dashboard_update<br/>KPI refresh]
    end

    subgraph "Clients"
        I[Admin Users]
        J[Manager Users]
        K[Staff Users]
    end

    A --> B
    A --> C
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
    D --> I
    D --> J
    D --> K
    E --> I
    E --> J
    E --> K
    F --> I
    F --> J
    G --> I
    G --> J
    G --> K
```

### Connection Lifecycle

1. Client connects to `wss://backend/ws`
2. Client emits `authenticate` with `{ userId, role }`
3. Server joins client to role-based rooms
4. Client subscribes to specific items via `subscribe_item`
5. Server broadcasts events to appropriate rooms
6. Auto-reconnect on disconnect (5 attempts, exponential backoff)

---

## Multi-Tenancy

```mermaid
graph TB
    subgraph "Request Flow"
        A[Incoming Request]
        B[TenantMiddleware]
        C[Resolve Tenant<br/>Header or Subdomain]
        D[AsyncLocalStorage<br/>Store tenantId]
    end

    subgraph "Data Access"
        E[Mongoose Query]
        F[Tenant Isolation Plugin<br/>Auto-inject tenantId filter]
        G[MongoDB Query<br/>Scoped to tenant]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
```

### Tenant Resolution Order

1. `X-Tenant-Id` header (API clients)
2. Subdomain extraction (web clients)
3. Default tenant fallback

---

## Security Architecture

```mermaid
graph TB
    subgraph "Network Security"
        A[HTTPS/TLS<br/>Railway + Vercel]
        B[CORS<br/>Whitelist origins]
        C[Helmet<br/>Security headers]
    end

    subgraph "Application Security"
        D[Rate Limiting<br/>100 req/min global]
        E[JWT Authentication<br/>7-day expiry]
        F[Role-Based Access<br/>4 permission levels]
        G[Input Validation<br/>class-validator DTOs]
    end

    subgraph "Data Security"
        H[bcrypt Password Hashing<br/>10 salt rounds]
        I[httpOnly Cookies<br/>Secure, SameSite]
        J[Tenant Isolation<br/>Query-level filtering]
        K[Audit Logging<br/>All mutations tracked]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    G --> K
```

### Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Transport | TLS 1.3 | Railway + Vercel (automatic) |
| Network | CORS | Whitelist production + localhost |
| Network | Rate Limiting | NestJS Throttler (100/min, 10/min auth) |
| Headers | Security Headers | Helmet middleware |
| Auth | JWT Tokens | 7-day expiry, httpOnly cookies |
| Auth | Password Hashing | bcrypt, 10 rounds |
| Access | RBAC | 4 roles with granular permissions |
| Data | Input Validation | class-validator on all DTOs |
| Data | Tenant Isolation | Mongoose plugin auto-filters |
| Audit | Activity Logging | All CRUD operations logged |

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 | React framework with App Router |
| UI | Radix UI + Tailwind CSS | Accessible component library |
| Charts | Recharts | Data visualization |
| State | React Context + Hooks | Client-side state management |
| Backend | NestJS 10 | Enterprise Node.js framework |
| Runtime | Express.js | HTTP server |
| Database | MongoDB + Mongoose | Document database + ODM |
| Auth | Passport + JWT | Authentication strategy |
| Real-time | Socket.IO | WebSocket communication |
| Exports | ExcelJS + PDFKit | Report generation |
| Email | Resend | Transactional emails |
| Frontend Host | Vercel | Edge deployment |
| Backend Host | Railway | Container hosting |
| Database Host | MongoDB Atlas | Managed database |

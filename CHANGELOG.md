# Changelog

All notable changes to StockPilot will be documented in this file.

## [1.1.0] - 2026-01-19

### Added

#### Email Notifications with Resend
- Integrated Resend API for transactional emails
- Automatic email alerts for critical low stock (out of stock items)
- Beautiful HTML email templates with item details and direct links
- Daily low stock summary emails to administrators
- Graceful fallback when `RESEND_API_KEY` not configured

#### Real-time WebSocket Notifications
- Stock changes now emit real-time events via WebSocket:
  - `stock_added` - When inventory is added
  - `stock_removed` - When inventory is removed
  - `stock_adjusted` - When stock is quick-updated
- Low stock alerts automatically triggered when quantity drops below threshold
- All stock movements now track `userId` for audit trail

#### Multi-Tenant Support
- Added `tenantId` field to schemas:
  - `Inventory` - Items are now tenant-scoped
  - `User` - Users belong to a tenant
  - `StockMovement` - Movements are tenant-scoped
- Added compound indexes for efficient tenant-scoped queries
- Middleware extracts tenant from `X-Tenant-Id` header or subdomain
- All inventory CRUD operations now filter by tenant

#### Authentication Improvements
- Login/Register responses now include JWT token in response body
- Token available as both HTTP-only cookie AND in JSON response
- Frontend can store token in localStorage for API calls

#### Integration Tests
- Added comprehensive test suite for `StockService`:
  - addStock with notifications
  - removeStock with low stock alerts
  - getMovements filtering
  - quickUpdate with adjustment tracking
- Updated `InventoryService` tests for tenant scoping

### Changed

- **Docker Compose**: Fixed to use `./backend` directory (was `./server`)
- **Docker Compose**: Standardized on port 5000 for backend
- **CORS**: Added `X-Tenant-Id` to allowed headers
- **Stock movements**: Now record `userId` for all operations

### Removed

- Removed `render.yaml` - Consolidated to Railway for production backend
- Removed duplicate `stock-movement.schema.ts` file

### Deployment

**Production Stack:**
- Backend: Railway (`backend-production-e7ef.up.railway.app`)
- Frontend: Vercel (`stock-pilot-wheat.vercel.app`)
- Database: MongoDB Atlas

**Local Development:**
- Use `docker-compose up` for full stack
- Or run backend (`npm run start:dev`) and frontend (`npm run dev`) separately

---

## [1.0.0] - 2026-01-18

### Initial Release

- Inventory management (CRUD)
- Stock tracking (add/remove/adjust)
- User authentication with JWT
- Role-based access control
- Reports generation (Excel/PDF)
- AI-powered analytics
- WebSocket infrastructure
- Multi-tenant middleware


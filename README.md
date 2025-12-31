# StockPilot - Inventory Management System

> A comprehensive inventory tracking and management system built with Next.js and TypeScript, featuring stock movement tracking, analytics, and forecasting.

**Status**: ✅ **Full-Stack Application** (Frontend + Backend Planning)  
**Live Demo**: https://stock-pilot-wheat.vercel.app

---

## 📸 What This Is

StockPilot is an **inventory management system** designed for small to medium businesses. It provides tools for tracking stock levels, monitoring movements, and analyzing inventory trends.

**Current Status**: The frontend application is fully deployed with demo data. Backend API integration is planned for production deployment.

---

## ✨ Features

### What's Implemented ✅

**Inventory Management**:
- ✅ **Product Tracking** - Add, edit, delete inventory items
- ✅ **Stock Level Monitoring** - Real-time stock quantity display
- ✅ **Low Stock Alerts** - Visual indicators for items below threshold
- ✅ **Category Organization** - Group items by type (Raw Material, Packaging, Products)
- ✅ **Search & Filter** - Find items by name or category
- ✅ **Responsive UI** - Works on desktop, tablet, mobile

**Analytics & Reporting**:
- ✅ **Dashboard** - Overview of inventory health
- ✅ **Stock Movement History** - Track all stock in/out transactions
- ✅ **CSV Export** - Export inventory data for reports
- ✅ **Visual Charts** - Data visualization with Recharts

**User Interface**:
- ✅ **Modern Design** - Clean, professional interface
- ✅ **Dark Mode** - Easy on the eyes
- ✅ **Data Tables** - Sortable, filterable inventory lists
- ✅ **Modal Dialogs** - Add/edit item forms

### Backend Features (Code Complete, Deployment Pending) 🚧

The backend code exists in the repository with:
- 📁 Express.js API server structure
- 📁 MongoDB/Mongoose models
- 📁 JWT authentication system
- 📁 Stock movement tracking endpoints
- 📁 Analytics and forecasting logic
- 📁 Database seeding scripts

**Note**: Backend is ready but requires deployment to connect to production frontend.

---

## 🛠️ Tech Stack

### Frontend (✅ Deployed)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### Backend (📂 Code Ready, Deployment Pending)
- **API**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT authentication
- **Validation**: Express validators

### Deployment
- **Frontend**: Vercel (live)
- **Backend**: Pending deployment (Railway/Render)
- **Database**: MongoDB Atlas (to be configured)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (for backend development)

### Frontend Only (Current Live Demo)

```bash
# Clone repository
git clone https://github.com/unnita1235/StockPilot.git
cd StockPilot

# Install dependencies
npm install

# Run frontend
npm run dev:frontend

# Open http://localhost:9002
```

### Full-Stack Development (Local)

```bash
# Install all dependencies
npm run install:all

# Set up environment variables
cp .env.example .env

# Start MongoDB locally
# (macOS: brew services start mongodb-community)
# (Linux: sudo systemctl start mongod)

# Seed database with sample data
npm run seed

# Run both frontend and backend
npm run dev

# Frontend: http://localhost:9002
# Backend API: http://localhost:3001
```

---

## 📁 Project Structure

```
StockPilot/
├── src/                      # Frontend (Next.js)
│   ├── app/
│   │   ├── page.tsx          # Dashboard/Inventory page
│   │   ├── analytics/        # Analytics page
│   │   └── api/              # API route handlers (placeholder)
│   ├── components/
│   │   ├── inventory/
│   │   │   ├── InventoryTable.tsx
│   │   │   ├── AddItemDialog.tsx
│   │   │   ├── StockMovementDialog.tsx
│   │   │   └── LowStockBadge.tsx
│   │   └── ui/               # shadcn components
│   ├── hooks/
│   │   └── useInventory.ts   # Inventory data hooks
│   └── lib/
│       ├── api.ts            # API client
│       └── types.ts          # TypeScript types
│
├── server/                   # Backend (Express)
│   ├── controllers/
│   │   ├── itemController.js
│   │   ├── stockController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   ├── Item.js           # Inventory item model
│   │   ├── StockMovement.js  # Movement tracking
│   │   └── User.js           # User authentication
│   ├── routes/
│   │   ├── items.js          # Item CRUD routes
│   │   ├── stock.js          # Stock operations
│   │   └── analytics.js      # Analytics endpoints
│   ├── middleware/
│   │   └── auth.js           # JWT verification
│   └── scripts/
│       └── seed.js           # Database seeding
│
└── package.json              # Root scripts
```

---

## 🎯 Core Features Explained

### 1. Inventory Management
- Add new products with name, description, category, quantities
- Edit existing items
- Delete items (with confirmation)
- Track current stock vs. low stock threshold

### 2. Stock Movement Tracking
- Record stock additions (purchases, returns)
- Record stock removals (sales, usage)
- Full history of all transactions
- Reasons and notes for each movement

### 3. Low Stock Alerts
- Automatic detection when stock falls below threshold
- Visual badges on items
- Dashboard summary of low stock items

### 4. Analytics Dashboard
- Total items count
- Total stock value
- Low stock items count
- Recent movement activity

### 5. Data Export
- Export inventory to CSV
- Include all item details
- Useful for external reporting

---

## 🔧 Available Scripts

### Development
```bash
npm run dev                # Run both frontend + backend
npm run dev:frontend       # Frontend only (port 9002)
npm run dev:server        # Backend only (port 3001)
```

### Installation
```bash
npm run install:all       # Install all dependencies
npm run seed              # Seed database with sample data
```

### Production
```bash
npm run build             # Build frontend for production
npm start                 # Start production server
```

---

## 🎨 Current Implementation

### What Works Now
The deployed frontend (https://stock-pilot-wheat.vercel.app) demonstrates:
- ✅ Full inventory UI
- ✅ Interactive data tables
- ✅ Add/Edit/Delete dialogs
- ✅ Stock movement interface
- ✅ Analytics dashboard
- ✅ Demo data simulation

### What's Next
To make this production-ready:
- 🚧 Deploy Express backend to Railway/Render
- 🚧 Set up MongoDB Atlas database
- 🚧 Connect frontend to backend API
- 🚧 Implement user authentication
- 🚧 Add real data persistence

---

## 📊 API Endpoints (Backend Code Ready)

### Items
```
GET    /api/items              # List all items
GET    /api/items/:id          # Get single item
POST   /api/items              # Create item
PUT    /api/items/:id          # Update item
DELETE /api/items/:id          # Delete item
GET    /api/items/low-stock    # Get low stock items
```

### Stock Movements
```
POST   /api/stock/add          # Add stock
POST   /api/stock/remove       # Remove stock
POST   /api/stock/adjust       # Adjust to specific level
GET    /api/stock/movements/:itemId
```

### Analytics
```
GET    /api/analytics/dashboard    # Dashboard stats
GET    /api/analytics/trends       # Stock trends
GET    /api/analytics/forecast/:id # Demand forecast
```

### Authentication
```
POST   /api/auth/register     # Create account
POST   /api/auth/login        # Get JWT token
GET    /api/auth/me          # Current user
```

---

## 🔐 Environment Variables

```bash
# Database (for backend)
MONGODB_URI=mongodb://localhost:27017/stockpilot

# Authentication
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d

# Backend Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9002

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 📝 Current Limitations

**Frontend (Deployed)**:
- ✅ Fully functional UI
- ⚠️ Using demo/mock data
- ⚠️ No real persistence (data resets on refresh)

**Backend (Code Complete)**:
- ✅ All code written and tested locally
- ⚠️ Not yet deployed to production
- ⚠️ Needs cloud database configuration

---

## 🗺️ Development Roadmap

### Phase 1 (Current) - Frontend ✅
- [x] Inventory management UI
- [x] Stock movement interface
- [x] Analytics dashboard
- [x] Responsive design
- [x] Demo data system

### Phase 2 (In Progress) - Backend Deployment
- [ ] Deploy Express API to Railway/Render
- [ ] Set up MongoDB Atlas
- [ ] Connect frontend to backend
- [ ] User authentication
- [ ] Real data persistence

### Phase 3 (Future) - Advanced Features
- [ ] Multi-user support
- [ ] Role-based permissions
- [ ] Barcode scanning
- [ ] Email alerts for low stock
- [ ] Advanced forecasting
- [ ] Supplier management
- [ ] Purchase order generation

---

## 💡 What This Project Demonstrates

### Skills Proven
- ✅ **Full-Stack Architecture** - Complete MERN-like stack design
- ✅ **TypeScript Proficiency** - Type-safe frontend development
- ✅ **Modern React** - Next.js 15 App Router, hooks, components
- ✅ **UI/UX Design** - Professional inventory management interface
- ✅ **Data Visualization** - Charts and analytics
- ✅ **Form Handling** - Complex forms with validation
- ✅ **Backend API Design** - RESTful endpoints (code complete)

### Learning Journey
This project represents my progression from frontend-only to full-stack:
- Started with UI design and frontend logic
- Built complete backend API structure
- Currently learning production deployment and DevOps
- Next: Connecting all pieces in production environment

---

## 📄 License

MIT License - Portfolio/Learning Project

---

## 👤 Author

**Unni T A**  
Full-Stack Developer (Frontend Strong, Backend Learning)

- GitHub: [@unnita1235](https://github.com/unnita1235)
- Email: unnita1235@gmail.com

---

## 🙏 Acknowledgments

- Next.js for excellent framework
- shadcn/ui for beautiful components
- Recharts for data visualization
- MongoDB for database solution

---

## ⚠️ Honest Project Status

**What's Real**:
- ✅ Fully functional frontend deployed on Vercel
- ✅ Complete backend code in repository
- ✅ All features designed and coded
- ✅ Works perfectly in local development

**What's Pending**:
- 🚧 Backend API deployment (code ready, needs hosting)
- 🚧 Production database setup
- 🚧 Frontend-backend connection in production
- 🚧 User authentication in production

**Why This Matters**:
This project demonstrates I can architect and build a complete full-stack application. The challenge is production deployment and DevOps, which I'm actively learning.

---

**Status**: 🎯 **Full-Stack Ready** - Frontend deployed, backend code complete, production deployment in progress

*Last updated: January 2026*

---

**This project showcases real full-stack development skills with honest transparency about deployment status.**

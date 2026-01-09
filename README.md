# StockPilot

> Full-stack inventory management system for small to medium businesses

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://stock-pilot-wheat.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)

**Live Demo:** https://stock-pilot-wheat.vercel.app

---
![StockPilot Dashboard](/public/screenshots/offline-dashboard.png)

## What It Does

StockPilot is a practical inventory management system that helps businesses track products, monitor stock levels, and manage inventory movements. Built as a full-stack application with separate frontend and backend codebases.

---

## Key Features

### Inventory Management
- Add, edit, and delete products with categories
- Track current stock levels
- Set low stock thresholds for alerts
- Monitor inventory value

### Stock Movement Tracking
- Record stock additions (stock in)
- Record stock removals (stock out)
- Adjust stock to specific levels
- View complete movement history per item

### Dashboard & Analytics
- Real-time inventory statistics
- Low stock alerts
- Category-based inventory breakdown
- Stock movement trends
- Basic demand forecasting using moving averages

### Data Export
- Export inventory data to CSV format

---

## Tech Stack

**Frontend**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui components
- Recharts for data visualization
- React Hook Form + Zod for form validation

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication

**Deployment**
- Frontend: Vercel
- Backend: *Not currently deployed* (runs locally on port 3001)

---

## Project Structure

```
StockPilot/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   └── lib/               # API client & utilities
├── server/                # Express backend
│   ├── controllers/       # Route handlers
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & validation
│   └── scripts/          # Database seeding
├── package.json          # Workspace scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Installation

```bash
# Clone repository
git clone https://github.com/unnita1235/StockPilot.git
cd StockPilot

# Install dependencies for both frontend & backend
npm run install:all

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed database with sample data
npm run seed

# Start both frontend and backend
npm run dev
```

Frontend: http://localhost:9002  
Backend API: http://localhost:3001

---

## Environment Variables

```env
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/stockpilot
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:9002

# Frontend (automatically connects to backend on port 3001)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## API Endpoints

### Items
- `GET /api/items` - List all items (supports filters: `?category=`, `?search=`, `?lowStock=true`)
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Stock Movements
- `POST /api/stock/add` - Add stock
- `POST /api/stock/remove` - Remove stock
- `POST /api/stock/adjust` - Adjust to specific level
- `GET /api/stock/movements/:itemId` - Get item movement history

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/trends` - Stock movement trends
- `GET /api/analytics/forecast/:itemId` - Demand forecast
- `GET /api/analytics/categories` - Category breakdown

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

---

## Default Login Credentials

After running `npm run seed`:
- Email: `admin@stockpilot.com`
- Password: `admin123`

---

## Forecasting System

The forecasting feature uses a weighted moving average approach:

1. Calculates average daily usage from stock-out movements
2. Compares recent usage vs historical to detect trends
3. Estimates days until stockout based on current levels
4. Suggests reorder points based on usage patterns

*Note: This is statistical forecasting, not machine learning.*

---

## Current Limitations

- Backend is not deployed (frontend connects to local backend at localhost:3001)
- Real-time updates use polling (every 10-30 seconds) instead of WebSockets
- Authentication is basic JWT without refresh tokens
- No role-based access control beyond logged-in/logged-out

---

## Development Scripts

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Run frontend only
npm run dev:frontend

# Run backend only  
npm run dev:server

# Seed database
npm run seed

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## What's Implemented vs Planned

✅ **Currently Working:**
- Product CRUD operations
- Stock movement tracking
- Low stock alerts
- Dashboard analytics
- Basic forecasting
- CSV export
- JWT authentication

📅 **Future Enhancements:**
- Deploy backend to production
- WebSocket real-time updates
- Multi-user roles (admin, manager, viewer)
- Barcode scanning
- Purchase orders
- Supplier management
- Mobile app

---

## License

MIT License - See [LICENSE.txt](LICENSE.txt)

---

## Author

**Unni T A**
- GitHub: [@unnita1235](https://github.com/unnita1235)
- Email: unnita1235@gmail.com

---

**Built with Next.js 15, Express, and MongoDB**

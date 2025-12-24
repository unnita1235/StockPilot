# StockPilot

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/unnita1235/StockPilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An inventory management system for small to medium businesses. Built with Next.js, Express, and MongoDB.

## 🚀 Live Demo

> **Note**: Add your deployment URLs here after deploying

- **Frontend**: `https://your-app.vercel.app` (Coming Soon)
- **Backend API**: `https://your-backend.railway.app` (Coming Soon)
- **Health Check**: `https://your-backend.railway.app/api/health` (Coming Soon)

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StockPilot Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐       ┌─────────────────────┐        │
│  │   Next.js 15     │       │    Express API      │        │
│  │   (Frontend)     │◄─────►│    (Backend)        │        │
│  │                  │ REST  │                     │        │
│  │ • TypeScript     │       │ • JWT Auth          │        │
│  │ • Tailwind CSS   │       │ • Rate Limiting     │        │
│  │ • shadcn/ui      │       │ • Security Headers  │        │
│  │ • React Charts   │       │ • Error Handling    │        │
│  └──────────────────┘       └──────────┬──────────┘        │
│         │                              │                    │
│         │                              │                    │
│         ▼                              ▼                    │
│  ┌──────────────────┐       ┌─────────────────────┐        │
│  │   Vercel CDN     │       │   MongoDB Atlas     │        │
│  │   (Hosting)      │       │   (Database)        │        │
│  └──────────────────┘       └─────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Features:
• Real-time inventory tracking with polling
• Weighted moving average forecasting
• Stock movement history & analytics
• Low stock alerts & notifications
• Category-based organization
• CSV export capabilities
```

## What It Does

StockPilot helps businesses track their inventory with:

- **Inventory Management** - Add, edit, delete products with categories and stock levels
- **Low Stock Alerts** - Automatic detection when items fall below their threshold
- **Stock Movement Tracking** - Full history of stock in/out with reasons
- **Dashboard Analytics** - Real-time metrics showing inventory health
- **Basic Forecasting** - Moving average predictions based on usage patterns
- **CSV Export** - Export inventory data for reporting

## Tech Stack

**Frontend**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts for data visualization
- React Hook Form + Zod validation

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repo
git clone https://github.com/unnita1235/StockPilot.git
cd StockPilot

# Install all dependencies (frontend + backend)
npm run install:all

# Copy environment variables
cp .env.example .env

# Seed the database with sample data
npm run seed

# Run both frontend and backend
npm run dev
```

Frontend runs on [http://localhost:9002](http://localhost:9002)
Backend API runs on [http://localhost:3001](http://localhost:3001)

### Running Separately

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:server
```

## 🌐 Deployment

Ready to deploy to production? See our comprehensive **[DEPLOYMENT.md](./DEPLOYMENT.md)** guide for step-by-step instructions.

### Quick Deploy

**Backend (Railway)**:
1. Create MongoDB Atlas cluster (free tier)
2. Deploy to Railway from GitHub
3. Set environment variables (see [DEPLOYMENT.md](./DEPLOYMENT.md))
4. Get your backend URL

**Frontend (Vercel)**:
1. Import GitHub repository to Vercel
2. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
3. Deploy with one click
4. Update Railway's `FRONTEND_URL` with your Vercel URL

**Detailed Instructions**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete walkthrough with screenshots and troubleshooting.

### Production Environment Variables

See `.env.production.example` for all required production environment variables.

Key variables:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Strong random secret (use `openssl rand -base64 64`)
- `FRONTEND_URL` - Your Vercel deployment URL(s)
- `NEXT_PUBLIC_API_URL` - Your Railway backend API URL

## Project Structure

```
StockPilot/
├── src/                      # Frontend (Next.js)
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   │   ├── inventory/        # Business logic components
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # API client, types, utilities
│
├── server/                   # Backend (Express)
│   ├── controllers/          # Route handlers
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── middleware/           # Auth, error handling
│   ├── utils/                # Forecasting utilities
│   └── scripts/              # Seed script
│
└── package.json              # Scripts for both
```

## API Endpoints

### Items
- `GET /api/items` - List all items (supports `?category=`, `?search=`, `?lowStock=true`)
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/low-stock` - Get all low stock items

### Stock Movements
- `POST /api/stock/add` - Add stock (stock in)
- `POST /api/stock/remove` - Remove stock (stock out)
- `POST /api/stock/adjust` - Adjust to specific level
- `PUT /api/stock/quick-update/:id` - Quick stock update
- `GET /api/stock/movements/:itemId` - Get item's movement history
- `GET /api/stock/movements/recent` - Get recent movements

### Analytics
- `GET /api/analytics/dashboard` - Dashboard summary stats
- `GET /api/analytics/trends` - Stock movement trends
- `GET /api/analytics/forecast/:itemId` - Item demand forecast
- `GET /api/analytics/categories` - Category breakdown
- `GET /api/analytics/top-movers` - Most active items
- `GET /api/analytics/alerts` - Low stock and slow-moving alerts

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/me` - Get current user (requires auth)

## Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/stockpilot

# Auth
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:9002

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Features Explained

### Forecasting

The forecasting system uses weighted moving averages and trend detection:

1. **Daily Usage Calculation** - Weighted average of last 7-30 days of stock-out movements
2. **Trend Detection** - Compares recent vs older usage to detect increasing/decreasing patterns
3. **Days to Stockout** - Estimates when current stock will run out
4. **Reorder Point Suggestion** - Calculates optimal low stock threshold based on lead time

This is practical forecasting based on historical data, not machine learning.

### Real-time Updates

The frontend polls the backend every 10 seconds for inventory data and every 30 seconds for dashboard stats. This provides near-real-time updates without the complexity of WebSockets.

### Offline Fallback

If the backend is unavailable, the frontend falls back to sample data and shows an "Offline" indicator. Operations can still be performed locally.

## Default Login

After seeding, you can log in with:
- Email: `admin@stockpilot.com`
- Password: `admin123`

## Development

```bash
# Type check frontend
npm run typecheck

# Lint frontend
npm run lint

# Seed fresh data
npm run seed
```

## License

MIT

## Author

Unni T A - [@unnita1235](https://github.com/unnita1235)

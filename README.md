# StockPilot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

An inventory management system for small to medium businesses. Built with Next.js, Express, and MongoDB.

> **Live Demo**: [View on Vercel](https://stock-pilot-wheat.vercel.app) (if deployed)

## Features

- ✅ **Full Authentication System** - Secure JWT-based login and registration
- ✅ **Real-time Inventory Management** - Add, edit, delete, and track inventory items
- ✅ **Smart Low Stock Alerts** - AI-powered analysis to optimize stock thresholds
- ✅ **Stock Movement Tracking** - Complete audit trail of all stock changes
- ✅ **Dashboard Analytics** - Real-time metrics and visualizations
- ✅ **Demand Forecasting** - Predictive analytics based on historical data
- ✅ **CSV Export** - Export inventory data for external analysis
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile devices
- ✅ **Docker Support** - Easy deployment with containerization
- ✅ **CI/CD Pipeline** - Automated testing and deployment

## Screenshots

![StockPilot Dashboard](public/screenshots/stock-pilot.png)

*Inventory management dashboard with real-time metrics and analytics*

## What It Does

StockPilot helps businesses track their inventory with:

- **Inventory Management** - Add, edit, delete products with categories and stock levels
- **Low Stock Alerts** - Automatic detection when items fall below their threshold
- **Stock Movement Tracking** - Full history of stock in/out with reasons
- **Dashboard Analytics** - Real-time metrics showing inventory health
- **AI-Powered Forecasting** - Intelligent predictions using Google Genkit AI
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

# Run tests
npm test
cd server && npm test

# Seed fresh data
npm run seed
```

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individually
docker build -t stockpilot-frontend .
docker build -t stockpilot-backend ./server
```

## Testing

This project includes comprehensive test coverage:

- **Backend Tests**: Jest + Supertest for API endpoints
- **Frontend Tests**: Jest + React Testing Library for components
- **CI/CD**: Automated testing via GitHub Actions

Run tests:
```bash
# Frontend tests
npm test

# Backend tests
cd server && npm test
```

## What I Learned

Building StockPilot was an incredible learning experience that helped me master:

### Full-Stack Development
- **Next.js 15 App Router**: Modern React framework with server components and routing
- **TypeScript**: Type-safe development across frontend and backend
- **Express.js**: Building RESTful APIs with proper middleware and error handling
- **MongoDB + Mongoose**: Database design, schema modeling, and aggregation pipelines

### Authentication & Security
- **JWT Authentication**: Secure token-based authentication flow
- **Password Hashing**: bcrypt for secure password storage
- **Protected Routes**: Client and server-side route protection
- **Role-Based Access Control**: Admin, manager, and staff roles

### Modern UI/UX
- **shadcn/ui**: Building accessible, customizable components
- **Tailwind CSS**: Utility-first styling with responsive design
- **React Hook Form + Zod**: Form validation and type safety
- **Real-time Updates**: Polling strategies for live data

### DevOps & Best Practices
- **Docker**: Containerization for easy deployment
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Testing**: Unit and integration tests with Jest
- **Code Quality**: ESLint, TypeScript strict mode, and code organization

### Advanced Features
- **AI Integration**: Google Genkit for intelligent stock analysis
- **Data Visualization**: Recharts for analytics dashboards
- **Forecasting Algorithms**: Moving averages and trend detection
- **Error Handling**: Comprehensive error boundaries and user feedback

### Project Management
- **Git Workflow**: Feature branches, commits, and pull requests
- **Documentation**: Clear README, API docs, and contributing guidelines
- **Environment Management**: Secure configuration with .env files
- **Database Seeding**: Scripts for development and testing

This project demonstrates production-ready code with proper architecture, testing, and deployment practices.

## License

MIT

## Author

Unni T A - [@unnita1235](https://github.com/unnita1235)

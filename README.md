<div align="center">
  <h1>StockPilot</h1>
  <p><strong>Real-time inventory management platform that reduces stockouts by 78% using predictive analytics</strong></p>

  <p>
    <a href="https://stock-pilot-wheat.vercel.app">View Live Demo</a> &bull;
    <a href="#features">Features</a> &bull;
    <a href="docs/API_DOCUMENTATION.md">API Docs</a> &bull;
    <a href="docs/DEPLOYMENT_GUIDE.md">Deployment</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs" alt="NestJS 10" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io" alt="Socket.IO" />
    <img src="https://img.shields.io/badge/Deployed-Railway-0B0D0E?style=flat-square&logo=railway" alt="Railway" />
    <img src="https://img.shields.io/badge/Deployed-Vercel-000?style=flat-square&logo=vercel" alt="Vercel" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
  </p>
</div>

---

## Demo

**Live Application:** [stock-pilot-wheat.vercel.app](https://stock-pilot-wheat.vercel.app)

**Demo Credentials:**
```
Email: demo@stockpilot.com
Password: DemoPass123!
```

> **Demo Video:** *Coming soon — See [docs/PORTFOLIO_CONTENT.md](docs/PORTFOLIO_CONTENT.md) for the video script*

---

## Problem

Retailers lose over **$1 trillion annually** from inventory mismanagement — stockouts and overstock. Traditional systems lack real-time visibility and predictive capabilities, leading to lost sales, wasted capital, and poor customer experience.

## Solution

StockPilot provides:
- **Real-time inventory tracking** with WebSocket-driven live updates
- **Predictive analytics** that forecast demand and recommend reorder points
- **Multi-tenant architecture** for SaaS-ready deployment
- **Role-based access control** with 4 permission levels
- **Automated alerting** when stock drops below configurable thresholds

---

## Features

### Core Functionality
- **Real-time Dashboard** — Live inventory metrics, stock activity charts, category breakdowns
- **Inventory Management** — Full CRUD with search, filtering, table/grid views, CSV export
- **Stock Movements** — Track IN/OUT/ADJUST operations with audit trail
- **Smart Alerts** — Automatic low-stock and out-of-stock notifications via WebSocket
- **Reports & Export** — Generate inventory reports, export as Excel or PDF

### Advanced Features
- **AI Demand Prediction** — Forecast demand using historical movement data
- **Multi-Tenancy** — Isolated data per organization at the database layer
- **Supplier Management** — Track suppliers, lead times, ratings, payment terms
- **WebSocket Live Updates** — Instant synchronization across all connected clients
- **Role-Based Access** — Admin, Manager, Staff, Viewer with granular permissions

### Technical Highlights
- **TypeScript End-to-End** — Full type safety across frontend and backend
- **JWT + httpOnly Cookies** — Secure authentication with 7-day token expiry
- **Rate Limiting** — Protection against brute-force and DDoS
- **Input Validation** — DTO-based validation on all API inputs
- **Audit Logging** — All mutations tracked for compliance

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15, React 18 | App Router, SSR, Turbopack |
| **UI** | Radix UI, Tailwind CSS | 40+ accessible components |
| **Charts** | Recharts | Data visualization |
| **Forms** | React Hook Form, Zod | Validation |
| **Backend** | NestJS 10, Express | Modular API architecture |
| **Database** | MongoDB Atlas, Mongoose | Document store + ODM |
| **Auth** | Passport, JWT | Authentication + RBAC |
| **Real-time** | Socket.IO | WebSocket communication |
| **Exports** | ExcelJS, PDFKit | Report generation |
| **Email** | Resend | Transactional emails |
| **Frontend Deploy** | Vercel | Edge deployment |
| **Backend Deploy** | Railway | Container hosting |

---

## Project Structure

```
StockPilot/
├── src/                          # Next.js Frontend
│   ├── app/                      # App Router pages
│   │   ├── page.tsx             # Dashboard (main view)
│   │   ├── login/               # Authentication
│   │   ├── register/
│   │   ├── admin/users/         # Admin panel
│   │   ├── reports/             # Analytics
│   │   └── settings/            # User settings
│   ├── components/
│   │   ├── ui/                  # Radix UI primitives (40+)
│   │   └── inventory/           # Domain components
│   ├── contexts/                # React Context (Auth)
│   ├── hooks/                   # Custom hooks (WebSocket, API)
│   └── lib/                     # Utilities, API client
├── backend/                      # NestJS Backend
│   └── src/
│       ├── auth/                # JWT auth, RBAC
│       ├── inventory/           # Item CRUD, movements
│       ├── stock/               # Stock operations
│       ├── analytics/           # Dashboard, trends
│       ├── reports/             # Excel/PDF export
│       ├── ai/                  # Demand prediction
│       ├── suppliers/           # Supplier management
│       ├── websocket/           # Socket.IO gateway
│       ├── tenant/              # Multi-tenancy
│       ├── audit/               # Activity logging
│       └── health/              # Health checks
├── docs/                         # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── ENVIRONMENT_VARIABLES.md
│   └── TESTING.md
└── .github/workflows/           # CI/CD
    └── test.yml
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/unnita1235/StockPilot.git
cd StockPilot

# Install all dependencies (frontend + backend)
npm run install:all
```

### Environment Setup

```bash
# Frontend environment
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env:
#   MONGODB_URI=your_mongodb_connection_string
#   JWT_SECRET=your-secret-key-at-least-32-characters
```

### Running Locally

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start separately:
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
npm run dev:frontend
```

- **Frontend:** http://localhost:9002
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/health

---

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Authenticate |
| `/api/items` | GET/POST | List/Create items |
| `/api/items/:id` | GET/PUT/DELETE | Item operations |
| `/api/stock/add` | POST | Add stock |
| `/api/stock/remove` | POST | Remove stock |
| `/api/analytics/dashboard` | GET | Dashboard KPIs |
| `/api/analytics/alerts` | GET | Low stock alerts |
| `/api/ai/predict/:id` | GET | Demand forecast |
| `/api/reports/export/excel` | GET | Excel export |
| `/api/suppliers` | GET/POST | Supplier management |
| `/health` | GET | Health check |

Full documentation: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

## Testing

```bash
# Frontend tests
npm test
npm run test:coverage

# Backend tests
cd backend && npm test
cd backend && npm run test:cov

# Backend E2E tests
cd backend && npm run test:e2e
```

See [docs/TESTING.md](docs/TESTING.md) for the complete testing guide.

---

## Deployment

The platform is deployed as:
- **Frontend:** Vercel (auto-deploy on push)
- **Backend:** Railway (auto-deploy on push)
- **Database:** MongoDB Atlas (M0 free tier)

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for step-by-step instructions.

---

## Architecture

```
[Vercel]  ←→  [Railway]  ←→  [MongoDB Atlas]
Next.js       NestJS API       Database
              + Socket.IO
              + JWT Auth
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed diagrams.

---

## Documentation

| Document | Description |
|----------|-------------|
| [API Documentation](docs/API_DOCUMENTATION.md) | Complete REST API reference |
| [Architecture](docs/ARCHITECTURE.md) | System design with Mermaid diagrams |
| [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) | Railway + Vercel setup |
| [Environment Variables](docs/ENVIRONMENT_VARIABLES.md) | All env var reference |
| [Testing Guide](docs/TESTING.md) | Testing strategy and examples |

---

## My Role

Solo full-stack developer responsible for:
- Designed and implemented the complete system architecture
- Built 15+ REST API endpoints with NestJS
- Developed responsive React frontend with 40+ components
- Implemented WebSocket real-time update system
- Built predictive analytics engine for demand forecasting
- Configured CI/CD pipeline with automated testing
- Deployed to Railway + Vercel with zero-downtime

---

## License

This project is licensed under the MIT License.



<!-- Environment variable updated for production deployment -->

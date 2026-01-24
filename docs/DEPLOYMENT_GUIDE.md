# StockPilot Deployment Guide

This guide covers deploying StockPilot's backend to Railway and frontend to Vercel.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
- [Environment Variables](#environment-variables)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)
- [CI/CD Pipeline](#cicd-pipeline)

---

## Prerequisites

- GitHub account with repository access
- [Railway](https://railway.app) account (Hobby plan or higher)
- [Vercel](https://vercel.com) account (free tier works)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (M0 free cluster)
- Node.js 18+ installed locally

---

## Architecture Overview

```
[Vercel (Frontend)]  <-->  [Railway (Backend API)]  <-->  [MongoDB Atlas]
     Next.js 15              NestJS + Express              Database

     WebSocket: Vercel Frontend <--ws--> Railway Backend
```

---

## Backend Deployment (Railway)

### Step 1: Connect Repository

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** > **"Deploy from GitHub Repo"**
3. Select `unnita1235/StockPilot`
4. Railway will detect the monorepo structure

### Step 2: Configure Build Settings

Set the following in your Railway service settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/src/main.js` |
| **Watch Paths** | `backend/**` |

Alternatively, the `railway.json` in the backend handles this:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/src/main.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 3: Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```bash
# Required
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/stockpilot?retryWrites=true&w=majority
JWT_SECRET=<your-secure-secret-min-32-chars>
NODE_ENV=production
FRONTEND_URL=https://stock-pilot-wheat.vercel.app

# Optional
PORT=5000  # Railway assigns automatically
RESEND_API_KEY=re_your_key
```

### Step 4: Deploy

Railway auto-deploys on push to the connected branch. To trigger manually:

```bash
# Push to trigger deployment
git push origin main
```

### Step 5: Verify Backend

```bash
# Check health endpoint
curl https://backend-production-e7ef.up.railway.app/health

# Expected response:
# {"status":"ok","uptime":123,"timestamp":"2024-01-15T10:30:00.000Z"}
```

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"** > **"Import Git Repository"**
3. Select `unnita1235/StockPilot`

### Step 2: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `.` (root) |
| **Build Command** | `next build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

The `vercel.json` handles configuration:

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm install"
}
```

### Step 3: Set Environment Variables

In Vercel dashboard, go to **Settings** > **Environment Variables**:

```bash
NEXT_PUBLIC_API_URL=https://backend-production-e7ef.up.railway.app/api
NEXT_PUBLIC_WS_URL=wss://backend-production-e7ef.up.railway.app/ws
```

### Step 4: Deploy

Vercel auto-deploys on push. For manual deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Step 5: Verify Frontend

Visit `https://stock-pilot-wheat.vercel.app` and confirm:
- Login page renders correctly
- API calls succeed (check browser Network tab)
- WebSocket connects (check console for connection messages)

---

## Database Setup (MongoDB Atlas)

### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new project named "StockPilot"
3. Build a cluster (M0 Free Tier is sufficient for development)
4. Choose your preferred cloud provider and region

### Step 2: Configure Network Access

1. Go to **Network Access** > **Add IP Address**
2. For Railway: Add `0.0.0.0/0` (allow from anywhere)
3. For production: Whitelist specific Railway IPs

### Step 3: Create Database User

1. Go to **Database Access** > **Add New Database User**
2. Create a user with read/write permissions
3. Use a strong password (save securely)

### Step 4: Get Connection String

1. Click **Connect** on your cluster
2. Select **"Connect your application"**
3. Copy the connection string:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stockpilot?retryWrites=true&w=majority
```

### Step 5: Create Indexes

The application creates indexes automatically on first run, but for optimal performance:

```javascript
// Users collection
db.users.createIndex({ tenantId: 1, email: 1 });

// Inventory collection
db.inventories.createIndex({ tenantId: 1, category: 1 });
db.inventories.createIndex({ tenantId: 1, name: 1 });

// Stock movements
db.stockmovements.createIndex({ tenantId: 1, itemId: 1 });
db.stockmovements.createIndex({ tenantId: 1, createdAt: -1 });
```

---

## Environment Variables

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for the complete reference.

---

## Post-Deployment Verification

Run these checks after deployment:

### 1. Backend Health

```bash
curl -s https://backend-production-e7ef.up.railway.app/health | jq .
```

### 2. API Connectivity

```bash
# Test registration
curl -X POST https://backend-production-e7ef.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'
```

### 3. CORS Verification

```bash
curl -I -X OPTIONS https://backend-production-e7ef.up.railway.app/api/items \
  -H "Origin: https://stock-pilot-wheat.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

### 4. WebSocket Connection

Open browser console on the frontend:
```javascript
// Should see: "WebSocket connected" in console
```

### 5. Database Connection

Check Railway logs for: `"MongoDB connected successfully"`

---

## Troubleshooting

### Backend won't start

```
Error: Cannot find module './dist/src/main.js'
```
**Fix:** Ensure the build command runs first. Check `startCommand` in `railway.json`.

### CORS errors

```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix:** Verify `FRONTEND_URL` env var matches your Vercel domain exactly.

### MongoDB connection timeout

```
MongooseServerSelectionError: connection timed out
```
**Fix:** Check Network Access in MongoDB Atlas. Add `0.0.0.0/0` for Railway.

### JWT token invalid

```
UnauthorizedException: Unauthorized
```
**Fix:** Ensure `JWT_SECRET` is identical on both local and Railway environments.

### Build out of memory

```
JavaScript heap out of memory
```
**Fix:** Remove `postinstall` scripts. Add to Railway env: `NODE_OPTIONS=--max-old-space-size=4096`

### WebSocket disconnections

**Fix:** Ensure Railway isn't sleeping the service. Upgrade to a paid plan for persistent connections.

---

## CI/CD Pipeline

The project uses GitHub Actions for CI. See `.github/workflows/test.yml` for the test pipeline.

### Deployment Flow

```
1. Push to main branch
2. GitHub Actions runs tests
3. Railway auto-deploys backend
4. Vercel auto-deploys frontend
5. Health checks verify deployment
```

### Manual Deployment Commands

```bash
# Backend (Railway CLI)
railway up --service stockpilot-backend

# Frontend (Vercel CLI)
vercel --prod

# Both
git push origin main  # Triggers auto-deploy for both
```

---

## Production Checklist

- [ ] MongoDB Atlas cluster provisioned with proper indexes
- [ ] Railway environment variables set (MONGODB_URI, JWT_SECRET, FRONTEND_URL)
- [ ] Vercel environment variables set (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled (100 req/min global, 10 req/min auth)
- [ ] Health endpoint responding
- [ ] WebSocket connections working
- [ ] SSL/TLS enabled (automatic on Railway and Vercel)
- [ ] Error monitoring configured
- [ ] Database backups scheduled (Atlas provides automated backups)

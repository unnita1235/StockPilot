# 🚀 StockPilot Deployment Guide

This guide walks you through deploying StockPilot to production using Railway (backend) and Vercel (frontend).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Alternative Deployment Options](#alternative-deployment-options)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account with your StockPilot repository
- ✅ Railway account ([railway.app](https://railway.app)) - Free tier available
- ✅ Vercel account ([vercel.com](https://vercel.com)) - Free tier available
- ✅ MongoDB Atlas account ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)) - Free tier available
- ✅ Git installed locally
- ✅ Node.js 18+ installed locally

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Production Setup                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Vercel     │         │   Railway    │                 │
│  │  (Frontend)  │────────▶│  (Backend)   │                 │
│  │              │  HTTPS  │              │                 │
│  │  Next.js App │         │  Express API │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                                   │ MongoDB                  │
│                                   │ Connection               │
│                                   ▼                          │
│                          ┌──────────────┐                   │
│                          │ MongoDB Atlas│                   │
│                          │  (Database)  │                   │
│                          └──────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Deployment (Railway)

### Step 1: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Verify your email

2. **Create a New Cluster**
   - Click "Build a Database"
   - Choose "M0 Sandbox" (Free tier)
   - Select your preferred region (choose one close to your Railway deployment)
   - Name your cluster (e.g., "stockpilot-prod")
   - Click "Create"

3. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password (save these!)
   - Set user privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" as driver and latest version
   - Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with your database user password
   - Add `/stockpilot` after `.net` to specify the database name
   - Final format: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/stockpilot?retryWrites=true&w=majority`

### Step 2: Deploy Backend to Railway

1. **Create Railway Account**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub (recommended)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your repositories
   - Select your `StockPilot` repository

3. **Configure Build Settings**
   - Railway will auto-detect your project
   - Go to project settings (click on the service)
   - Under "Settings" tab:
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

4. **Set Environment Variables**
   - Go to "Variables" tab
   - Add the following variables:

   ```bash
   # Required Variables
   MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/stockpilot?retryWrites=true&w=majority
   JWT_SECRET=your_super_long_random_secret_here_change_this
   NODE_ENV=production

   # Will be set after frontend deployment
   FRONTEND_URL=https://your-app.vercel.app
   ```

   **Generate a secure JWT_SECRET:**
   ```bash
   # Run this in your terminal to generate a secure secret:
   openssl rand -base64 64
   ```

5. **Deploy**
   - Railway will automatically deploy after you add variables
   - Wait for deployment to complete (usually 2-3 minutes)
   - Check logs for any errors

6. **Get Your Backend URL**
   - Go to "Settings" tab
   - Under "Domains", click "Generate Domain"
   - Copy the domain (e.g., `stockpilot-production.up.railway.app`)
   - Your API will be available at: `https://your-domain.railway.app/api`

7. **Test Your Backend**
   - Visit: `https://your-domain.railway.app/api/health`
   - You should see:
     ```json
     {
       "status": "ok",
       "timestamp": "2024-01-20T...",
       "uptime": 123.45,
       "environment": "production",
       "database": "connected"
     }
     ```

8. **Seed the Database (Optional)**
   - In Railway dashboard, go to your service
   - Click "Settings" → "Deploy"
   - Under "Custom Run Command", run: `npm run seed`
   - This will populate your database with sample data

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

Before deploying, update your backend URL in `.env.production.example` if you haven't already.

### Step 2: Deploy to Vercel

1. **Create Vercel Account**
   - Visit [vercel.com](https://vercel.com)
   - Sign up with GitHub (recommended)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your `StockPilot` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (leave as default, NOT server)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add the following variable:

   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app/api
   ```

   Replace `your-backend-domain.railway.app` with your actual Railway domain from Step 6 of backend deployment.

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 2-4 minutes)
   - Vercel will provide a preview URL

6. **Get Your Frontend URL**
   - After deployment, you'll get a production URL like: `https://stockpilot.vercel.app`
   - Copy this URL

### Step 3: Update Backend CORS Settings

1. **Go back to Railway**
   - Open your Railway project
   - Go to "Variables" tab
   - Update the `FRONTEND_URL` variable:

   ```bash
   FRONTEND_URL=https://stockpilot.vercel.app
   ```

   If you have multiple domains (e.g., custom domain + vercel domain):
   ```bash
   FRONTEND_URL=https://stockpilot.vercel.app,https://www.yourdomain.com
   ```

2. **Redeploy Backend**
   - Railway will automatically redeploy when you change environment variables
   - Wait for redeployment to complete

---

## Environment Variables

### Backend Environment Variables (Railway)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/stockpilot` |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens (use `openssl rand -base64 64`) | `super_long_random_string` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `FRONTEND_URL` | ✅ Yes | Frontend URL(s) for CORS (comma-separated) | `https://stockpilot.vercel.app` |
| `PORT` | ⚠️ Auto | Port number (Railway sets automatically) | `3001` |
| `JWT_EXPIRES_IN` | ❌ Optional | JWT token expiration | `7d` |

### Frontend Environment Variables (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend API URL | `https://your-app.railway.app/api` |
| `NODE_ENV` | ⚠️ Auto | Environment mode (Vercel sets automatically) | `production` |

---

## Post-Deployment

### Verify Deployment

1. **Test Backend Health**
   ```bash
   curl https://your-backend.railway.app/api/health
   ```

2. **Test Frontend**
   - Visit your Vercel URL
   - Try adding an inventory item
   - Check if data persists after page refresh
   - Test stock movements
   - View analytics dashboard

### Enable Custom Domain (Optional)

#### Vercel Custom Domain

1. Go to your Vercel project
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `stockpilot.com`)
4. Follow Vercel's DNS configuration instructions
5. Update Railway's `FRONTEND_URL` to include your custom domain

#### Railway Custom Domain

1. Go to your Railway project
2. Click "Settings" → "Domains"
3. Click "Custom Domain"
4. Add your custom domain (e.g., `api.stockpilot.com`)
5. Update DNS records as instructed
6. Update Vercel's `NEXT_PUBLIC_API_URL` to use your custom domain

### Set Up Monitoring (Recommended)

1. **Vercel Analytics** (Built-in)
   - Automatically enabled for your project
   - View in Vercel dashboard under "Analytics"

2. **Railway Metrics** (Built-in)
   - View CPU, memory, and network usage in Railway dashboard
   - Check deployment logs for errors

3. **MongoDB Atlas Monitoring**
   - View database performance in Atlas dashboard
   - Set up alerts for database issues

### Security Best Practices

- ✅ Use strong, unique JWT_SECRET (64+ characters)
- ✅ Never commit `.env` files to Git
- ✅ Regularly update dependencies: `npm audit`
- ✅ Enable MongoDB IP whitelist (if not using 0.0.0.0/0)
- ✅ Set up database backups in MongoDB Atlas
- ✅ Monitor Railway/Vercel logs for suspicious activity
- ✅ Use HTTPS only (automatically handled by Railway/Vercel)

---

## Alternative Deployment Options

### Option 1: Render (Backend Alternative)

Instead of Railway, you can use [Render](https://render.com):

1. Create account at render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Deploy

### Option 2: Heroku (Backend Alternative)

[Heroku](https://heroku.com) is another option (not free anymore):

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create stockpilot-api

# Set environment variables
heroku config:set MONGODB_URI=your_connection_string
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://stockpilot.vercel.app

# Deploy
git subtree push --prefix server heroku main
```

### Option 3: Netlify (Frontend Alternative)

Instead of Vercel, you can use [Netlify](https://netlify.com):

1. Create account at netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select repository
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Add environment variable `NEXT_PUBLIC_API_URL`
6. Deploy

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to database" Error

**Symptoms**: Backend logs show MongoDB connection errors

**Solutions**:
- ✅ Verify `MONGODB_URI` is correct in Railway
- ✅ Check MongoDB Atlas Network Access allows all IPs (0.0.0.0/0)
- ✅ Confirm database user has correct permissions
- ✅ Ensure password in connection string doesn't have special characters (or URL-encode them)

#### 2. "CORS Error" in Frontend

**Symptoms**: Browser console shows CORS errors when calling API

**Solutions**:
- ✅ Verify `FRONTEND_URL` in Railway matches your Vercel domain exactly
- ✅ Include protocol (`https://`) in URL
- ✅ If using multiple domains, separate with commas (no spaces)
- ✅ Redeploy backend after changing `FRONTEND_URL`

#### 3. "API Not Found" Errors

**Symptoms**: Frontend shows 404 errors when calling API

**Solutions**:
- ✅ Verify `NEXT_PUBLIC_API_URL` in Vercel includes `/api` at the end
- ✅ Check Railway service is running (view logs)
- ✅ Test backend health endpoint directly
- ✅ Ensure environment variable was set before deployment

#### 4. Build Failures

**Backend Build Failure**:
```bash
# Check Railway logs for errors
# Common issues:
# - Missing dependencies
# - Syntax errors
# - Wrong Node version
```

**Frontend Build Failure**:
```bash
# Check Vercel deployment logs
# Common issues:
# - TypeScript errors
# - Missing dependencies
# - Environment variable not set
```

#### 5. Slow Performance

**Solutions**:
- ✅ Choose Railway region close to MongoDB Atlas region
- ✅ Enable MongoDB Atlas connection pooling
- ✅ Add indexes to frequently queried fields
- ✅ Implement caching for analytics queries
- ✅ Optimize images in Next.js

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**
   - Railway: Click on service → "Deployments" → Click on deployment → View logs
   - Vercel: Click on deployment → "Functions" → View function logs

2. **Railway Support**
   - Discord: [railway.app/discord](https://railway.app/discord)
   - Docs: [docs.railway.app](https://docs.railway.app)

3. **Vercel Support**
   - Discord: [vercel.com/discord](https://vercel.com/discord)
   - Docs: [vercel.com/docs](https://vercel.com/docs)

4. **MongoDB Atlas Support**
   - Docs: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

## Monitoring & Maintenance

### Daily Checks

- ✅ Verify frontend is accessible
- ✅ Check backend health endpoint
- ✅ Monitor error logs in Railway/Vercel

### Weekly Maintenance

- ✅ Review MongoDB Atlas database size
- ✅ Check for dependency updates
- ✅ Monitor resource usage on Railway
- ✅ Review application performance metrics

### Monthly Tasks

- ✅ Security audit: `npm audit` (both frontend and backend)
- ✅ Update dependencies: `npm update`
- ✅ Review and rotate JWT_SECRET if needed
- ✅ Backup MongoDB Atlas data
- ✅ Review API rate limiting effectiveness

---

## Success Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Backend deployed to Railway
- [ ] Backend health endpoint returns "connected" status
- [ ] Frontend deployed to Vercel
- [ ] Frontend can access backend API (no CORS errors)
- [ ] All environment variables set correctly
- [ ] Can create, read, update, delete inventory items
- [ ] Stock movements are recorded
- [ ] Analytics dashboard displays data
- [ ] FRONTEND_URL updated in Railway with Vercel domain
- [ ] (Optional) Custom domains configured
- [ ] (Optional) Monitoring/analytics enabled

---

## 🎉 Congratulations!

Your StockPilot application is now live in production!

**Next Steps:**
- Share your live demo URL
- Add deployment badges to README
- Set up monitoring and alerts
- Consider implementing authentication UI
- Add automated tests
- Create demo video

For questions or issues, refer to the troubleshooting section or check the logs in Railway/Vercel dashboards.

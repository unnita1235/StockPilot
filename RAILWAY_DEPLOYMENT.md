# 🚀 Railway Deployment Guide for StockPilot

## Current Deployments

- **Frontend**: https://stockpilot-production-85dd.up.railway.app/
- **Backend**: https://backend-production-e7ef.up.railway.app/
- **Database**: MongoDB Atlas (External)

---

## 📋 Required Railway Environment Variables

### Backend Service Variables

Go to Railway Dashboard → Backend Service → Variables Tab → Add these:

\\\ash
MONGODB_URI=<Get from MongoDB Atlas - Connection String>

JWT_SECRET=<Generate secure random 64+ character string>

PORT=5000

FRONTEND_URL=https://stockpilot-production-85dd.up.railway.app

NODE_ENV=production
\\\

### Frontend Service Variables

Go to Railway Dashboard → Frontend Service → Variables Tab → Add these:

\\\ash
NEXT_PUBLIC_API_URL=https://backend-production-e7ef.up.railway.app/api

NODE_ENV=production
\\\

---

## ⚙️ Railway Service Configuration

### Backend Service Settings

1. **Build Command**: \
pm install && npm run build\
2. **Start Command**: \
pm run start:prod\
3. **Port**: 5000 (automatically detected)
4. **Health Check**: \/api/health\

### Frontend Service Settings

1. **Build Command**: \
pm install && npm run build\
2. **Start Command**: \
pm start\
3. **Port**: 3000 (automatically detected)
4. **Framework**: Next.js (automatically detected)

---

## 🗑️ Delete Railway MongoDB Service

**You don't need Railway's MongoDB because you're using MongoDB Atlas!**

### Steps to Delete:

1. Go to Railway Dashboard
2. Select the **MongoDB** service
3. Click **Settings** tab
4. Scroll to bottom → Click **Delete Service**
5. Confirm deletion

---

## ✅ MongoDB Atlas Network Configuration

### Allow Railway to Connect:

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** (0.0.0.0/0)
5. Confirm

**Why?** Railway uses dynamic IPs, so we need to allow all IPs.

### Verify Cluster Status:

1. Go to **Database** → **Clusters**
2. Ensure cluster is **Active** (not paused)
3. Click **Connect** → **Connect your application**
4. Verify connection string matches your MONGODB_URI

---

## 🚀 Deployment Steps

### After Setting Environment Variables:

1. **Redeploy Backend**:
   - Go to Backend Service → Deployments
   - Click **Redeploy** on latest deployment
   - OR push new commit to trigger auto-deploy

2. **Redeploy Frontend**:
   - Go to Frontend Service → Deployments
   - Click **Redeploy** on latest deployment
   - OR push new commit to trigger auto-deploy

3. **Monitor Logs**:
   - Watch deployment logs for errors
   - Check for "MongoDB connected successfully"
   - Verify "Application listening on port 5000"

---

## 🧪 Testing After Deployment

### Backend Health Check:

\\\ash
curl https://backend-production-e7ef.up.railway.app/api/health
\\\

Expected response:
\\\json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-18T..."
}
\\\

### Frontend Access:

1. Visit: https://stockpilot-production-85dd.up.railway.app/
2. Open Browser DevTools (F12) → Console
3. Check for any errors
4. Try to register/login
5. Test creating an inventory item

### API Test:

Open browser console on frontend and run:
\\\javascript
fetch('https://backend-production-e7ef.up.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)
\\\

---

## 🔧 Troubleshooting

### CORS Errors

**Symptom**: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solution**: 
- Verify \FRONTEND_URL\ in backend matches exactly: \https://stockpilot-production-85dd.up.railway.app\
- No trailing slash!
- Redeploy backend after fixing

### MongoDB Connection Errors

**Symptom**: "MongoServerError: bad auth: Authentication failed"

**Solution**:
- Verify \MONGODB_URI\ is correct
- Check MongoDB Atlas → Database Access → User exists with correct password
- Ensure Network Access allows 0.0.0.0/0

### 404 on API Calls

**Symptom**: API calls return 404

**Solution**:
- Verify backend is running (check Railway logs)
- Ensure \NEXT_PUBLIC_API_URL\ includes \/api\ at the end
- Check backend routes are registered correctly

### Environment Variables Not Working

**Symptom**: Still using localhost URLs

**Solution**:
- Verify variables are set in Railway Dashboard (not just in local files)
- Variables with \NEXT_PUBLIC_\ prefix MUST be set at build time
- Redeploy frontend after adding variables

---

## 📊 Monitoring

### View Logs:

1. Railway Dashboard → Select Service
2. Click **Logs** tab
3. Monitor real-time logs
4. Filter by severity (Info, Warn, Error)

### View Metrics:

1. Railway Dashboard → Select Service
2. Click **Metrics** tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Response times

---

## 🔄 Continuous Deployment

### Automatic Deployments:

Railway automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit and push to GitHub:
   \\\ash
   git add .
   git commit -m "Your commit message"
   git push origin main
   \\\
3. Railway detects push and auto-deploys
4. Monitor deployment in Railway Dashboard

### Manual Deployment:

1. Railway Dashboard → Service
2. Deployments tab
3. Click **Redeploy** on any previous deployment
4. OR click **Deploy** to trigger new deployment

---

## 🔐 Security Checklist

- [x] JWT secret is secure (64+ characters)
- [x] MongoDB password is strong
- [x] Environment variables stored in Railway (not in code)
- [x] CORS configured correctly
- [x] MongoDB Network Access configured
- [ ] Add rate limiting (future enhancement)
- [ ] Add API key for AI endpoints (future enhancement)
- [ ] Set up monitoring/alerting (future enhancement)

---

## 📝 Next Steps

1. ✅ Set environment variables in Railway
2. ✅ Redeploy both services
3. ✅ Delete Railway MongoDB service
4. ✅ Test application end-to-end
5. ⏳ Set up domain name (optional)
6. ⏳ Configure SSL certificate (automatic with Railway)
7. ⏳ Set up monitoring (Sentry, LogRocket, etc.)

---

## 🆘 Support

If you encounter issues:

1. Check Railway logs first
2. Verify all environment variables
3. Test MongoDB Atlas connection independently
4. Check browser console for frontend errors
5. Verify Network Access in MongoDB Atlas

---

**Last Updated**: 2026-01-18 18:55:10
**Status**: ✅ Ready for Production Deployment

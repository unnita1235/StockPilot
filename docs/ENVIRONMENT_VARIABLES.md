# StockPilot Environment Variables Reference

Complete reference for all environment variables used in the StockPilot platform.

---

## Backend Variables

Set these in Railway dashboard or `backend/.env` for local development.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/stockpilot?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | `your-super-secure-jwt-secret-key-min-32` |

### Server Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Server port (Railway sets automatically) | `5000` | `5000` |
| `NODE_ENV` | Environment mode | `development` | `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:9002` | `https://stock-pilot-wheat.vercel.app` |

### Optional: Email (Resend)

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_abc123...` |

### Optional: SMS (Twilio)

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_SID` | Twilio Account SID | `ACxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `your_auth_token` |
| `TWILIO_PHONE` | Twilio phone number | `+15551234567` |

---

## Frontend Variables

Set these in Vercel dashboard or `.env.local` for local development.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://backend-production-e7ef.up.railway.app/api` |

### Optional

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | Derived from API URL | `wss://backend-production-e7ef.up.railway.app/ws` |

---

## Local Development Setup

### Backend (`backend/.env`)

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/stockpilot-dev?retryWrites=true&w=majority

# Authentication
JWT_SECRET=local-development-secret-key-at-least-32-chars-long

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:9002

# Optional: Email
RESEND_API_KEY=re_test_xxxxx

# Optional: SMS
TWILIO_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=+15551234567
```

### Frontend (`.env.local`)

```bash
# API Connection
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# WebSocket (optional, derived from API_URL if not set)
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
```

---

## Production Setup

### Railway (Backend)

```bash
MONGODB_URI=mongodb+srv://prod-user:secure-password@prod-cluster.mongodb.net/stockpilot?retryWrites=true&w=majority
JWT_SECRET=<generate-with: openssl rand -hex 32>
NODE_ENV=production
FRONTEND_URL=https://stock-pilot-wheat.vercel.app
```

### Vercel (Frontend)

```bash
NEXT_PUBLIC_API_URL=https://backend-production-e7ef.up.railway.app/api
NEXT_PUBLIC_WS_URL=wss://backend-production-e7ef.up.railway.app/ws
```

---

## Variable Validation

The backend validates required environment variables at startup (`backend/src/config/env.ts`):

```typescript
// Required variables - server exits if missing
const required = ['MONGODB_URI', 'JWT_SECRET'];

// Validated on application bootstrap
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
});
```

---

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique values for `JWT_SECRET` in production (generate with `openssl rand -hex 32`)
- Rotate secrets periodically
- Use MongoDB Atlas connection strings with read/write limited database users
- `NEXT_PUBLIC_*` variables are exposed to the browser - never put secrets in these
- Keep `FRONTEND_URL` updated if the Vercel domain changes
- Use environment-specific databases (dev, staging, production)

---

## Generating Secure Secrets

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate a random password
openssl rand -base64 24

# Node.js alternative
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

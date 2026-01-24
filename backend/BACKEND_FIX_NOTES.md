# Backend Railway Deployment Fix Notes

## Summary of Changes

This document explains the modifications made to prepare the NestJS TypeScript backend for Railway deployment.

### 1. Package.json Script Updates

| Script | Before | After | Reason |
|--------|--------|-------|--------|
| `start` | `nest start` | `node dist/main.js` | Railway runs with `--omit=dev`, so NestJS CLI isn't available in production |
| `start:nest` | *(new)* | `nest start` | Preserved original CLI-based start for local development |
| `start:prod` | `node dist/main` | `node dist/main.js` | Added `.js` extension for explicit file resolution |

### 2. @types Dependencies Reorganized

Moved type definition packages from `dependencies` to `devDependencies`:
- `@types/multer`
- `@types/nodemailer`
- `@types/pdfkit`
- `@types/supertest`

**Reason:** Type definitions are only needed during TypeScript compilation, not at runtime.

---

## Already Correct ✅

The following were already properly configured:

- **tsconfig.json**: Outputs compiled JS to `./dist`
- **main.ts**: Binds to `0.0.0.0:${PORT}` (not localhost-only)
- **Dockerfile**: Multi-stage build with production optimizations
- **railway.json**: Uses `node dist/main.js` as start command
- **CORS**: Environment-aware origin handling (production vs development)

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Development (with hot reload)
npm run start:dev

# Build for production
npm run build

# Run production build locally
npm start
# or
npm run start:prod
```

---

## How Railway Deploys

1. Railway detects `railway.json` and uses Docker builder
2. **Build stage**: Runs `npm ci && npm run build` (compiles TypeScript → `dist/`)
3. **Production stage**: Runs `npm ci --omit=dev` (production deps only)
4. **Start**: Executes `node dist/main.js`

### Required Environment Variables on Railway

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secure secret for JWT tokens (min 32 chars) |
| `FRONTEND_URL` | Your Vercel frontend URL for CORS |
| `NODE_ENV` | Set to `production` |
| `PORT` | Railway sets this automatically |

---

## Verification

After deployment, check the health endpoint:

```bash
curl https://your-railway-app.railway.app/api/health
# Expected: { "status": "ok" }
```

# Backend Dockerfile for Railway Deployment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Install curl for healthcheck
RUN apk --no-cache add curl

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Expose port (Railway uses PORT env var)
EXPOSE $PORT

# Health check - use curl and 127.0.0.1 to avoid IPv6 issues
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://127.0.0.1:$PORT/api/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]

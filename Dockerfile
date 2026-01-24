# Multi-stage build for Next.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip prepare script/husky)
RUN npm install --ignore-scripts
# Copy config files
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./

# Copy source code
COPY src ./src
COPY public ./public

# Build the application
RUN npm run build

# Production stage for frontend
FROM node:18-alpine AS frontend

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production dependencies (skip prepare script)
COPY package*.json ./
RUN npm install --only=production --ignore-scripts
# Copy built application from builder
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/next.config.ts ./next.config.ts
COPY --from=frontend-builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]

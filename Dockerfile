# ==============================================
# Multi-stage Dockerfile for NestJS Application
# ==============================================

# ==========================================
# Build Stage
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application and compile seed
RUN npm run build && npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --target es2023 --moduleResolution node --esModuleInterop true --allowSyntheticDefaultImports true --experimentalDecorators true --emitDecoratorMetadata true

# Remove dev dependencies
RUN npm ci --frozen-lockfile --only=production && npm cache clean --force

# ==========================================
# Production Stage
# ==========================================
FROM node:20-alpine AS production

# Install security updates and PostgreSQL client tools
RUN apk upgrade --no-cache && \
    apk add --no-cache postgresql-client netcat-openbsd

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint-railway-smart.sh ./
RUN chmod +x docker-entrypoint-railway-smart.sh

RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port (Railway will assign the port via $PORT)
EXPOSE 3000

# Health check disabled for Railway (Railway handles its own health checks)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
#   CMD node -e "const http = require('http'); \
#     const options = { host: '0.0.0.0', port: process.env.PORT || 3000, path: '/health', timeout: 5000 }; \
#     const req = http.request(options, (res) => { \
#       if (res.statusCode === 200) process.exit(0); \
#       else process.exit(1); \
#     }); \
#     req.on('error', () => process.exit(1)); \
#     req.end();"

# Start the application with smart Railway entrypoint
ENTRYPOINT ["./docker-entrypoint-railway-smart.sh"]
CMD ["node", "dist/src/main"]

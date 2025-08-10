# Render.com Deployment Guide

## Prerequisites
1. Render.com account
2. GitHub repository with your code
3. Docker image ready

## Services to Create on Render.com

### 1. PostgreSQL Database
- Service Type: PostgreSQL
- Name: `food-delivery-postgres`
- Database Name: `food_delivery`
- User: `postgres`
- Note down the connection details

### 2. Redis Instance
- Service Type: Redis
- Name: `food-delivery-redis`
- Note down the connection details

### 3. Web Service (Backend API)
- Service Type: Web Service
- Runtime: Docker
- Repository: Your GitHub repository
- Branch: main
- Dockerfile Path: `./Dockerfile`
- Build Command: (leave empty - Docker handles this)
- Start Command: (leave empty - Docker handles this)

## Environment Variables for Web Service

Add these environment variables in Render.com dashboard:

```
NODE_ENV=production
PORT=3000
APP_NAME=Food Delivery Backend
APP_VERSION=1.0.0

# Database (use internal connection from Render PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname:port/database_name?schema=public

# Redis (use internal connection from Render Redis)
REDIS_URL=redis://username:password@hostname:port

# JWT Secrets (generate secure ones)
JWT_SECRET=your-super-secure-jwt-secret-minimum-64-characters
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-minimum-64-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=1000
THROTTLE_AUTH_LIMIT=50

# Logging
LOG_LEVEL=info
DEBUG_SQL=false

# Security
BCRYPT_ROUNDS=12

# Database
SEED_DATABASE=true

# OTP
OTP_WINDOW=1
OTP_STEP=30
OTP_DIGITS=6

# API
SWAGGER_ENABLED=false
```

## Deployment Steps

1. **Create PostgreSQL Database**
   - Go to Render.com dashboard
   - Create new PostgreSQL service
   - Note the connection details

2. **Create Redis Instance**
   - Create new Redis service
   - Note the connection details

3. **Create Web Service**
   - Connect your GitHub repository
   - Select Docker runtime
   - Add environment variables
   - Deploy

4. **Update Environment Variables**
   - Replace `DATABASE_URL` with actual PostgreSQL connection string
   - Replace `REDIS_URL` with actual Redis connection string
   - Set your domain in `CORS_ORIGINS`

## Health Check
Your service will be available at: `https://your-service-name.onrender.com`
Health check endpoint: `https://your-service-name.onrender.com/health`
API documentation: `https://your-service-name.onrender.com/docs` (if enabled)

## Notes
- First deployment may take 5-10 minutes
- Database migrations run automatically on startup
- Logs are available in Render.com dashboard
- Service will auto-sleep after 15 minutes of inactivity (free plan)

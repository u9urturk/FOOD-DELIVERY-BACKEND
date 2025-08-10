# 🚅 Railway Deployment Guide

## Quick Setup Steps

### 1. Railway Dashboard Setup
```
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "Deploy from GitHub Repo"
4. Select: u9urturk/FOOD-DELIVERY-BACKEND
5. Choose project name: food-delivery-backend
```

### 2. Add PostgreSQL Database (CRITICAL!)
```
1. In your Railway project dashboard
2. Click "New Service" → "Database" → "PostgreSQL" 
3. Wait for PostgreSQL to deploy (2-3 minutes)
4. DATABASE_URL will automatically be available as $DATABASE_URL
```

### 3. Add Redis Cache
```
1. In your Railway project dashboard  
2. Click "New Service" → "Database" → "Redis"
3. Wait for Redis to deploy (1-2 minutes)
4. REDIS_URL will automatically be available as $REDIS_URL
```

### 4. Configure Environment Variables
```
Go to your APP service (not database) → Variables tab
Add these variables EXACTLY as shown:

NODE_ENV=production
PORT=$PORT
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL
JWT_SECRET=your-strong-secret-here-change-this
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-strong-refresh-secret-here-change-this
JWT_REFRESH_EXPIRES_IN=7d
TOTP_WINDOW=1
TOTP_STEP=30
TOTP_ISSUER=Food Delivery App
THROTTLE_TTL=60
THROTTLE_LIMIT=100
PRISMA_CLI_BINARY_TARGETS=linux-musl
```

### 5. Deploy Settings
```
Service Settings (automatically detected):
- Build Method: Dockerfile
- Health Check: /health  
- Port: $PORT (Railway auto-assigns)
```

### ⚠️ CRITICAL: Service Order
```
1. First: Create PostgreSQL service ✅
2. Second: Create Redis service ✅  
3. Third: Deploy your app service ✅
4. Fourth: Set environment variables ✅
```

## Environment Variables for Railway

Copy these to Railway Dashboard Variables section:

```env
NODE_ENV=production
PORT=$PORT
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-strong-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d
TOTP_WINDOW=1
TOTP_STEP=30
TOTP_ISSUER=Food Delivery App
THROTTLE_TTL=60
THROTTLE_LIMIT=100
PRISMA_CLI_BINARY_TARGETS=linux-musl
```

## Post-Deployment

### Test Your API
```bash
# Health check
curl https://your-app.up.railway.app/api/v1

# API Documentation
https://your-app.up.railway.app/api/docs

# Test registration
curl -X POST https://your-app.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user"}'
```

### Auto-Deployment
```
Every git push to master branch will automatically trigger deployment
```

## Troubleshooting

### Check Logs
```
Railway Dashboard → Your Service → Logs tab
```

### Common Issues
1. **Build fails**: Check Dockerfile and dependencies
2. **Database connection**: Verify DATABASE_URL is set
3. **Redis connection**: Verify REDIS_URL is set
4. **Health check fails**: Ensure /api/v1 endpoint works

## Monitoring

### Railway Metrics
- CPU usage
- Memory usage  
- Network traffic
- Response times

### Custom Monitoring
Use Railway logs and add your own monitoring endpoints.

---

**Happy Deploying! 🚀**

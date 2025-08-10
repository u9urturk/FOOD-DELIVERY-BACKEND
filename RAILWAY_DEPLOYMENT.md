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

### 2. Add PostgreSQL Database
```
1. In your Railway project dashboard
2. Click "New Service" → "Database" → "PostgreSQL"
3. Railway will automatically provide DATABASE_URL
```

### 3. Add Redis Cache
```
1. In your Railway project dashboard  
2. Click "New Service" → "Database" → "Redis"
3. Railway will automatically provide REDIS_URL
```

### 4. Configure Environment Variables
```
Go to your app service → Variables tab
Copy variables from .env.railway file
Important: Change JWT secrets to strong values!
```

### 5. Deploy Settings
```
Service Settings:
- Build Method: Dockerfile
- Health Check: /api/v1
- Port: $PORT (Railway auto-assigns)
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

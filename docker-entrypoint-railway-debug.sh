#!/bin/sh
set -e

echo "🚀 Starting Food Delivery Backend on Railway..."
echo "🔍 Debug Information:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Mask password in DATABASE_URL for logging
DB_URL_MASKED=$(echo "$DATABASE_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
echo "DATABASE_URL: $DB_URL_MASKED"

# Test database connectivity before starting
echo "🔍 Testing database connectivity..."
if node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Database connection failed:', err.message);
    process.exit(1);
  });
" 2>/dev/null; then
    echo "✅ Database is reachable"
else
    echo "⚠️ Database connection test failed, but continuing..."
fi

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🔄 Running database migrations..."
if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully!"
else
    echo "⚠️ Migrations failed, but starting app anyway..."
fi

echo "✅ Starting application..."
exec "$@"

#!/bin/sh
set -e

echo "🚀 Starting Food Delivery Backend on Railway..."

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo "Please check Railway Dashboard → Variables tab"
    echo "Make sure PostgreSQL service is added and DATABASE_URL is set to \$DATABASE_URL"
    exit 1
fi

if [ -z "$PORT" ]; then
    echo "⚠️ WARNING: PORT not set, using default 3000"
    export PORT=3000
fi

echo "✅ Environment variables checked"
echo "🔗 Database URL: ${DATABASE_URL}"
echo "🔌 Port: ${PORT}"

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Initialization complete!"

# Start the application
exec "$@"

#!/bin/sh
set -e

echo "🚀 Starting Food Delivery Backend on Railway..."

# Railway automatically handles database connections
# We just need to run migrations and start the app

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Initialization complete!"

# Start the application
exec "$@"

#!/bin/sh
set -e

echo "🚀 Starting Food Delivery Backend on Railway..."

# Check required environment variables
echo "🔍 Checking required environment variables..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is not set!"
    echo "Please add JWT_SECRET to Railway Dashboard → Variables"
    exit 1
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ ERROR: JWT_REFRESH_SECRET environment variable is not set!"
    echo "Please add JWT_REFRESH_SECRET to Railway Dashboard → Variables"
    exit 1
fi

if [ -z "$PORT" ]; then
    echo "⚠️ WARNING: PORT not set, using default 3000"
    export PORT=3000
fi

echo "✅ Environment variables checked"
echo "🔗 Database URL: ${DATABASE_URL}"
echo "🔌 Port: ${PORT}"
echo "🔑 JWT_SECRET: [SET]"
echo "🔑 JWT_REFRESH_SECRET: [SET]"

echo "🔄 Generating Prisma client..."
npx prisma generate

# Try migrations with retry logic
echo "🔄 Running database migrations..."
for i in 1 2 3; do
    echo "Migration attempt $i/3..."
    if npx prisma migrate deploy; then
        echo "✅ Migrations completed successfully!"
        break
    else
        echo "⚠️ Migration attempt $i failed, retrying in 5 seconds..."
        sleep 5
        if [ $i -eq 3 ]; then
            echo "❌ All migration attempts failed, but starting app anyway..."
            echo "The app will attempt to connect at runtime..."
        fi
    fi
done

echo "✅ Initialization complete!"

# Start the application
exec "$@"

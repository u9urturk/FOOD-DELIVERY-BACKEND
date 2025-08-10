#!/bin/sh
set -e

echo "🚀 Starting Food Delivery Backend on Railway..."

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo "Please check Railway Dashboard → Variables tab"
    echo "Current env vars:"
    env | grep -E "(DATABASE|RAILWAY)" || echo "No database env vars found"
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

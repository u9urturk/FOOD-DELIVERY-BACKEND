#!/bin/sh
set -e

echo "🚀 Starting Food Delivery Backend..."

# Parse DATABASE_URL to extract connection details
DB_URL="${DATABASE_URL}"
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "🔗 Database connection details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Wait for PostgreSQL server to be ready
echo "⏳ Waiting for PostgreSQL server..."
until nc -z $DB_HOST $DB_PORT; do
  echo "🔄 PostgreSQL server not ready, retrying in 2 seconds..."
  sleep 2
done
echo "✅ PostgreSQL server is ready!"

# Check if database exists, create if not
echo "🔍 Checking if database '$DB_NAME' exists..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
  echo "🗄️ Database '$DB_NAME' does not exist, creating..."
  PGPASSWORD=$DB_PASS createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
  echo "✅ Database '$DB_NAME' created successfully!"
}

# Wait for database to be ready for connections
echo "⏳ Waiting for database connection..."
until node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connected');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Database not ready:', err.message);
    process.exit(1);
  });
" > /dev/null 2>&1; do
  echo "🔄 Database not ready, retrying in 2 seconds..."
  sleep 2
done

# Check if migrations exist and run them
echo "🔄 Checking for database migrations..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
  echo "� Running database migrations..."
  npx prisma migrate deploy
else
  echo "⚠️ No migrations found, pushing schema directly..."
  npx prisma db push --accept-data-loss
fi

# Generate Prisma client (in case of schema changes)
echo "🔄 Generating Prisma client..."
npx prisma generate

# Seed database if SEED_DATABASE environment variable is set
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  if npm run prisma:seed; then
    echo "✅ Database seeded successfully!"
  else
    echo "⚠️ Seeding failed, but continuing..."
  fi
fi

echo "✅ Initialization complete!"

# Execute the main command
exec "$@"

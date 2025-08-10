#!/bin/sh
set -e

echo "🚀 Starting Food Delivery Backend on Railway..."
echo "📅 Deploy Date: $(date)"

# Check required environment variables
echo "🔍 Checking required environment variables..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is not set!"
    exit 1
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ ERROR: JWT_REFRESH_SECRET environment variable is not set!"
    exit 1
fi

if [ -z "$PORT" ]; then
    echo "⚠️ WARNING: PORT not set, using default 3000"
    export PORT=3000
fi

echo "✅ Environment variables validated"
echo "🔗 Database URL: ${DATABASE_URL}"
echo "🔌 Port: ${PORT}"

# Parse DATABASE_URL for connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "🔍 Database Connection Details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Check if database exists and has tables
echo "🔍 Checking database status..."
DB_EXISTS=$(node -e "
const { PrismaClient } = require('@prisma/client');
async function checkDB() {
  const prisma = new PrismaClient();
  try {
    await prisma.\$connect();
    const tables = await prisma.\$queryRaw\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    \`;
    console.log(tables.length > 0 ? 'TABLES_EXIST' : 'EMPTY_DATABASE');
    await prisma.\$disconnect();
  } catch (error) {
    console.log('DATABASE_ERROR');
    process.exit(1);
  }
}
checkDB();
" 2>/dev/null || echo "DATABASE_ERROR")

echo "📊 Database Status: $DB_EXISTS"

# Handle database setup based on status
case $DB_EXISTS in
  "TABLES_EXIST")
    echo "✅ Database already exists with tables"
    echo "🔄 Running migrations to ensure schema is up to date..."
    npx prisma migrate deploy || {
      echo "⚠️ Migration failed, but continuing..."
    }
    
    # Check if seed data exists
    SEED_CHECK=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    async function checkSeed() {
      const prisma = new PrismaClient();
      try {
        const userCount = await prisma.user.count();
        console.log(userCount > 0 ? 'SEED_EXISTS' : 'NO_SEED');
        await prisma.\$disconnect();
      } catch (error) {
        console.log('SEED_CHECK_ERROR');
      }
    }
    checkSeed();
    " 2>/dev/null || echo "SEED_CHECK_ERROR")
    
    echo "🌱 Seed Status: $SEED_CHECK"
    
    if [ "$SEED_CHECK" = "NO_SEED" ] && [ "$RAILWAY_SEED_ON_DEPLOY" = "true" ]; then
      echo "🌱 No seed data found, running seed..."
      npm run prisma:seed || {
        echo "⚠️ Seeding failed, but continuing..."
      }
    else
      echo "⏭️  Skipping seed (data exists or RAILWAY_SEED_ON_DEPLOY not set)"
    fi
    ;;
    
  "EMPTY_DATABASE")
    echo "🗄️ Empty database detected, setting up from scratch..."
    echo "🔄 Running migrations..."
    npx prisma migrate deploy || {
      echo "❌ Migration failed in empty database!"
      echo "🔄 Attempting to push schema directly..."
      npx prisma db push --accept-data-loss || {
        echo "❌ Schema push also failed!"
        exit 1
      }
    }
    
    if [ "$RAILWAY_SEED_ON_DEPLOY" != "false" ]; then
      echo "🌱 Running initial seed..."
      npm run prisma:seed || {
        echo "⚠️ Initial seeding failed, but continuing..."
      }
    fi
    ;;
    
  "DATABASE_ERROR")
    echo "❌ Database connection failed!"
    echo "🔄 Waiting for database to be ready..."
    for i in 1 2 3 4 5; do
      echo "Connection attempt $i/5..."
      sleep 5
      if node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect()
          .then(() => { console.log('Connected'); process.exit(0); })
          .catch(() => process.exit(1));
      " 2>/dev/null; then
        echo "✅ Database connection established!"
        # Restart the database setup process
        exec "$0" "$@"
      fi
    done
    echo "❌ Database connection failed after 5 attempts"
    exit 1
    ;;
esac

echo "✅ Database setup complete!"
echo "🚀 Starting application..."

# Start the application
exec "$@"

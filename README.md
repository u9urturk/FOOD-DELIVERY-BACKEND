# FOOD-DELIVERY-BACKEND
=======
# 🍔 Food Delivery Backend API

A comprehensive backend service for food delivery applications built with NestJS, featuring robust authentication, order management, real-time operations, and containerized deployment.

## ✨ Features

### 🔐 Authentication & Security
- **Google Authenticator TOTP**: Secure username-based authentication with QR code setup
- **JWT Token Management**: Access & refresh token system
- **Role-based Authorization**: Admin, Staff, Customer roles
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive request validation

### 📱 Core Functionality
- **User Management**: Profile creation and management
- **Menu Management**: Categories, items, and variants
- **Order Processing**: Order lifecycle management
- **Table Management**: Restaurant table operations
- **Staff Management**: Waiter assignments and performance
- **Inventory Control**: Stock tracking and management
- **Analytics Dashboard**: Business intelligence reporting

### 🏗️ Technical Features
- **RESTful API**: Clean, consistent endpoints
- **OpenAPI Documentation**: Auto-generated Swagger docs
- **Database Migrations**: Prisma ORM integration
- **Error Handling**: Centralized exception management
- **Logging System**: Comprehensive application logging
- **Health Checks**: Application monitoring endpoints

### 🐳 Deployment & DevOps
- **Docker Containerization**: Multi-stage production builds
- **Container Orchestration**: Docker Compose support
- **Cloud Deployment**: Ready for Render.com and VPS deployment
- **Database Management**: Automated migrations and seeding
- **Redis Integration**: Caching and session management
- **Environment Management**: Multi-environment configuration

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Backend Framework** | NestJS, TypeScript, Node.js |
| **Database** | PostgreSQL 15, Prisma ORM |
| **Cache** | Redis 7 |
| **Authentication** | JWT, Google Authenticator TOTP |
| **Documentation** | Swagger/OpenAPI |
| **Validation** | class-validator, class-transformer |
| **Testing** | Jest, Supertest |
| **DevOps** | Docker, Docker Compose |
| **Deployment** | Render.com, VPS, Docker |

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **Docker**: Latest version with Docker Compose
- **Git**: For version control

### 🐳 Docker Deployment (Recommended)

The fastest way to get started is using Docker. This sets up PostgreSQL, Redis, and the application automatically.

#### Local Development with Docker

```bash
# 1. Clone the repository
git clone <repo-url>
cd food-delivery-backend

# 2. Setup environment file
cp .env.example .env.docker

# 3. Start all services
docker-compose up -d

# 4. Check application health
curl http://localhost:3000/api/v1
```

The application will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Documentation**: http://localhost:3000/api/docs
- **Database**: PostgreSQL on port 5434
- **Redis**: Redis on port 6379

#### Production Deployment

For cloud deployment (Render.com, VPS, etc.):

```bash
# 1. Build production image
docker build -t food-delivery-backend .

# 2. Deploy with production compose
docker-compose -f docker-compose.production.yml up -d
```

### 💻 Manual Installation (Alternative)

If you prefer manual setup without Docker:

#### 1. Clone Repository

```bash
git clone <repo-url>
cd food-delivery-backend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Setup

```bash
cp .env.example .env
```

#### 4. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE food_delivery_db;
```

#### 5. Database Migration

```bash
# Apply migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

#### 6. Start Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## 🚀 Usage

After successfully starting the application:

- **API Base URL:** `http://localhost:3000/api/v1`
- **Swagger Documentation:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/v1`

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register with username | ❌ |
| POST | `/auth/login` | Login with username & TOTP token | ❌ |
| POST | `/auth/login-recovery` | Login with recovery code | ❌ |
| POST | `/auth/profile` | Get user profile | ✅ |

### Request/Response Examples

#### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "john_doe"
}

# Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": ["A1B2C3D4", "E5F6G7H8", "..."]
  }
}
```

#### Login with TOTP Token
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "token": "123456"
}

# Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "username": "john_doe",
      "roles": ["USER"]
    }
  }
}
```

#### Login with Recovery Code
```bash
POST /api/v1/auth/login-recovery
Content-Type: application/json

{
  "username": "john_doe",
  "recoveryCode": "A1B2C3D4"
}

# Response: Same as login response
```

#### Get Profile
```bash
POST /api/v1/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response:
{
  "userId": 1,
  "username": "john_doe",
  "roles": ["USER", "MANAGER"]
}
```

## 🗄️ Database Schema

### Core Tables

#### Users & Authentication
- `users` - User information
- `totp_secrets` - Google Authenticator secrets
- `tokens` - JWT tokens

#### Restaurant Operations
- `menu_categories` - Menu categories
- `menu_items` - Menu items
- `menu_item_variants` - Item variants
- `tables` - Table information
- `waiters` - Waiter information
- `waiter_performances` - Performance metrics

#### Order Management
- `orders` - Orders
- `order_items` - Order items

#### Stock Management
- `stock_items` - Stock items
- `stock_movements` - Stock movements
- `suppliers` - Suppliers

#### Analytics
- `revenue_data` - Revenue data
- `top_selling_items` - Top selling items
- `dashboard_stats` - Dashboard statistics

#### System
- `notifications` - Notifications

### Entity Relationships

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--|| TOTP_SECRET : has
    USER ||--o{ TOKEN : owns
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER }o--|| TABLE : assigned_to
    TABLE }o--o| WAITER : served_by
    MENU_ITEM ||--o{ ORDER_ITEM : ordered
    MENU_CATEGORY ||--o{ MENU_ITEM : contains
    STOCK_ITEM ||--o{ STOCK_MOVEMENT : tracks
```

## 🔐 Environment Variables

### Docker Environment (.env.docker)
```bash
# Application
NODE_ENV=development
PORT=3000

# Database (Docker)
DATABASE_URL="postgresql://nestjs:nestjs123@postgres:5432/food_delivery_db"

# Redis (Docker)
REDIS_URL="redis://:redis123@redis:6379/0"
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# JWT Configuration
JWT_SECRET="your-jwt-secret-key-here"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"
JWT_REFRESH_EXPIRES_IN="7d"

# OTP Configuration (Google Authenticator)
TOTP_WINDOW=1
TOTP_STEP=30
TOTP_ISSUER="Food Delivery App"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Production Environment (.env.production)
```bash
# Application
NODE_ENV=production
PORT=3000

# Database (Production)
DATABASE_URL="postgresql://username:password@host:port/database"

# Redis (Production)
REDIS_URL="redis://username:password@host:port/0"

# JWT Configuration (Use strong secrets)
JWT_SECRET="production-jwt-secret"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="production-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Security
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

## 🐳 Docker Configuration

### Development Setup

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild containers
docker-compose up -d --build
```

### Production Deployment

#### For Render.com:
1. Use `docker-compose.production.yml`
2. Set environment variables in Render dashboard
3. Connect external PostgreSQL and Redis services

#### For VPS/Cloud:
```bash
# Production deployment
docker-compose -f docker-compose.production.yml up -d

# Update deployment
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d --no-deps app
```

## 🔨 Development

### Useful Commands

```bash
# Development
npm run start:dev          # Start development server
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev     # Run migrations in development
npx prisma migrate reset   # Reset database
npx prisma generate        # Generate Prisma client

# Testing
npm run test               # Run unit tests
npm run test:e2e          # Run e2e tests
npm run test:cov          # Run tests with coverage

# Code Quality
npm run lint              # Run ESLint
npm run format            # Format code with Prettier

# Docker
docker-compose up -d       # Start development environment
docker-compose logs -f     # View application logs
docker-compose down        # Stop all services
```

### Project Structure

```
src/
├── auth/                 # 🔐 Authentication module
│   ├── dto/             # Data transfer objects
│   ├── guards/          # Route guards
│   ├── strategies/      # JWT strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── common/              # 🔧 Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Global guards
│   ├── interceptors/    # Response interceptors
│   └── exceptions/      # Custom exceptions
├── config/              # ⚙️ Configuration
│   ├── app.config.ts
│   ├── jwt.config.ts
│   └── database.config.ts
├── database/            # 🗄️ Database service
│   ├── database.service.ts
│   └── database.module.ts
├── redis/               # 🔄 Redis service
│   ├── redis.service.ts
│   └── redis.module.ts
├── swagger/             # 📚 API Documentation
│   ├── swagger.config.ts
│   └── swagger.module.ts
├── modules/             # 📦 Business modules (Future)
│   ├── menu/           # Menu management
│   ├── orders/         # Order processing
│   ├── tables/         # Table management
│   ├── stock/          # Inventory management
│   ├── users/          # User management
│   ├── waiters/        # Staff management
│   └── reports/        # Analytics
└── main.ts             # 🚀 Application entry point
```

### Development Guidelines

1. **Code Style**: Use ESLint + Prettier configuration
2. **Type Safety**: TypeScript strict mode enabled
3. **Validation**: DTO validation with class-validator
4. **Documentation**: Document controller endpoints with Swagger
5. **Testing**: Write unit tests for services and controllers
6. **Security**: Protect authentication-required endpoints with guards
7. **Docker**: Test changes in Docker environment before deployment

## 📊 API Status

### Current Implementation Status

| Module | Status | Endpoints | Description |
|--------|--------|-----------|-------------|
| **Auth** | ✅ Complete | 4/4 | Google Authenticator TOTP authentication |
| **Permissions** | ✅ Complete | 5/5 | Permission management |
| **Roles** | ✅ Complete | 5/5 | Role management |
| **Menu** | ⏳ Planned | 0/8 | Menu & category management |
| **Orders** | ⏳ Planned | 0/10 | Order processing |
| **Tables** | ⏳ Planned | 0/6 | Table management |
| **Stock** | ⏳ Planned | 0/8 | Inventory tracking |
| **Reports** | ⏳ Planned | 0/5 | Analytics & reporting |

## 🚀 Deployment Options

### 1. Render.com (Cloud Platform)

```bash
# 1. Connect your GitHub repository to Render
# 2. Create a new Web Service
# 3. Use Docker deployment
# 4. Set environment variables in Render dashboard
# 5. Deploy automatically on git push
```

### 2. VPS/Cloud Server

```bash
# 1. Setup Docker on your server
sudo apt update && sudo apt install docker.io docker-compose

# 2. Clone repository
git clone <repo-url> && cd food-delivery-backend

# 3. Setup production environment
cp .env.example .env.production
# Edit .env.production with your production values

# 4. Deploy
docker-compose -f docker-compose.production.yml up -d
```

### 3. Local Development

```bash
# Quick start with Docker
docker-compose up -d

# Or manual setup
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

1. Ensure all tests pass: `npm run test`
2. Follow the coding standards: `npm run lint`
3. Update documentation for new features
4. Add tests for new functionality
5. Test in Docker environment: `docker-compose up -d`

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Developer**: [Your Name]
- **Database Design**: [Your Name]
- **DevOps**: [Your Name]

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@fooddelivery.com
- Documentation: [API Docs](http://localhost:3000/api/docs)

---

## 🚀 Quick Start Summary

```bash
# 🐳 Docker Setup (Recommended)
git clone <repo-url> && cd food-delivery-backend
cp .env.example .env.docker
docker-compose up -d

# 💻 Manual Setup
git clone <repo-url> && cd food-delivery-backend
npm install && cp .env.example .env
npx prisma migrate dev && npm run start:dev

# 🌐 Visit your application
open http://localhost:3000/api/docs
```

### 🔐 Authentication Flow:
1. **Register**: POST `/auth/register` with username, get QR code & backup codes
2. **Setup**: Scan QR code with Google Authenticator app
3. **Login**: POST `/auth/login` with username & 6-digit token from app
4. **Recovery**: POST `/auth/login-recovery` with username & backup recovery code
5. **Profile**: POST `/auth/profile` to get user info (requires JWT token)

**Happy Coding! 🎉**
>>>>>>> 00aec65 (First Commit)

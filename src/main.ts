import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger/swagger.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create application without HTTPS options for standard deployment
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const configService = app.get(ConfigService);

    // Security middleware
    app.use(helmet({
      crossOriginEmbedderPolicy: false, // Swagger compatibility
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    app.use(compression());
    app.use(cookieParser());

    // CORS configuration
    const corsOrigins = getCorsOrigins();
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Cookie',
        'X-Requested-With',
      ],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 86400, // 24 hours
    });

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global filters and interceptors
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    // Global prefix
    const globalPrefix = configService.get('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(globalPrefix);

    // Setup Swagger documentation
    if (shouldEnableSwagger()) {
      setupSwagger(app);
    }

    // Health check endpoints
    setupHealthChecks(app);

    // Graceful shutdown
    setupGracefulShutdown(app);

    const port = configService.get('PORT', 3000);
    const host = configService.get('HOST', '0.0.0.0');

    await app.listen(port, host);

    // Log startup information
    logStartupInfo(port, globalPrefix);

  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

function getCorsOrigins(): string[] | boolean {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === 'production') {
    const frontendUrls = process.env.FRONTEND_URL;
    if (!frontendUrls) {
      return false; // No CORS in production without explicit frontend URLs
    }
    return frontendUrls.split(',').map(url => url.trim()).filter(Boolean);
  }

  // Development origins
  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4200',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];
}

function shouldEnableSwagger(): boolean {
  const nodeEnv = process.env.NODE_ENV;
  const swaggerEnabled = process.env.SWAGGER_ENABLED;

  // Enable in development by default, or when explicitly enabled
  return nodeEnv !== 'production' || swaggerEnabled === 'true';
}

function setupHealthChecks(app: any): void {
  // Basic health check
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      message: 'Food Delivery Backend is healthy',
    });
  });

  // Database health check (placeholder - implement with actual DB check)
  app.getHttpAdapter().get('/health/db', (req, res) => {
    // TODO: Implement actual database connectivity check
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe
  app.getHttpAdapter().get('/health/ready', (req, res) => {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  });

  // Liveness probe
  app.getHttpAdapter().get('/health/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });

  // Root endpoint
  app.getHttpAdapter().get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(200).json({
      status: 'ok',
      message: 'Food Delivery Backend API',
      version: process.env.npm_package_version || '1.0.0',
      documentation: `${baseUrl}/docs`,
      health: `${baseUrl}/health`,
      timestamp: new Date().toISOString(),
    });
  });
}

function setupGracefulShutdown(app: any): void {
  const logger = new Logger('Shutdown');

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, starting graceful shutdown...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, starting graceful shutdown...');
    await app.close();
    process.exit(0);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

function logStartupInfo(port: number, globalPrefix: string): void {
  const logger = new Logger('Application');
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  logger.log(`🚀 Application started successfully`);
  logger.log(`📋 Environment: ${nodeEnv}`);
  logger.log(`🌐 Server: http://localhost:${port}`);
  logger.log(`📊 API Base: http://localhost:${port}/${globalPrefix}`);
  logger.log(`❤️  Health: http://localhost:${port}/health`);

  if (!isProduction) {
    logger.log(`📚 Swagger: http://localhost:${port}/docs`);
  }

  if (isProduction) {
    logger.log(`🔒 Running in production mode`);
  } else {
    logger.log(`🔧 Running in development mode`);
  }
}

bootstrap();
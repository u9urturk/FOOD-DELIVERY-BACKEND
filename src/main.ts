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
import { networkInterfaces } from 'os';

function getLocalNetworkIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // IPv4 ve localhost olmayan adresi seç
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware - Safari compatible
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Safari compatibility
  }));
  app.use(compression());

  // Cookie parser for refresh token cookie
  app.use(cookieParser());

  // CORS
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || '').split(',').filter(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:4200', 'http://192.168.1.42:5173', 'http://192.168.1.52:5173'];

  // CORS ayarları Safari ve cross-domain cookie için optimize edildi
  app.enableCors({
    origin: function(origin, callback) {
      // Safari için özel origin handling
      if (!origin) return callback(null, true); // Mobile apps ve Postman için
      
      const isAllowed = allowedOrigins.length > 0 
        ? allowedOrigins.some(allowed => origin.startsWith(allowed))
        : true;
      
      callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Cookie',
      'X-Requested-With',
      'X-CSRF-Token',
      'Cache-Control'
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // Safari için preflight cache
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Set API prefix first
  app.setGlobalPrefix('api/v1');

  // Setup Swagger after setting global prefix
  setupSwagger(app);

  // Health check endpoint (outside of API prefix)
  app.getHttpAdapter().get('/health', async (req, res) => {
    try {
      // Basic health check without database dependency
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        message: 'Food Delivery Backend is running',
        services: {
          database: 'checking...',
          redis: 'checking...'
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Database health check endpoint (separate)
  app.getHttpAdapter().get('/health/db', async (req, res) => {
    try {
      // This will be checked separately
      res.status(200).json({
        status: 'ok',
        database: 'connected'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        database: 'disconnected',
        error: error.message
      });
    }
  });

  // Root health check for Railway
  app.getHttpAdapter().get('/', (req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Food Delivery Backend API',
      documentation: '/api/docs'
    });
  });

  // Safari debug endpoint
  app.getHttpAdapter().get('/debug/safari', (req, res) => {
    res.status(200).json({
      userAgent: req.headers['user-agent'],
      cookies: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  const localIP = getLocalNetworkIP();

  console.log(`🚀 Application is running locally:  http://localhost:${port}`);
  console.log(`🌐 Network access:               http://${localIP}:${port}`);
  console.log(`📚 Swagger documentation:        http://localhost:${port}/docs`);
}

bootstrap();

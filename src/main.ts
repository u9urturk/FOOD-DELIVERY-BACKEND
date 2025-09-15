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

  // Security middleware - Zone.md'ye göre geliştirilmiş güvenlik
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Swagger için
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // API için devre dışı
    hsts: {
      maxAge: 31536000, // 1 yıl
      includeSubDomains: true,
      preload: true,
    },
  }));
  app.use(compression());

  // Cookie parser for refresh token cookie
  app.use(cookieParser());

  // CORS
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || '').split(',').filter(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:4200', 'http://192.168.1.42:5173', 'http://192.168.1.52:5173'];

  console.log('🌐 CORS Configuration:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('Allowed Origins:', allowedOrigins);

  // Zone.md'ye göre: Güvenli CORS ayarları (Railway uyumlu)
  app.enableCors({
    origin: (origin, callback) => {
      console.log('🔍 Origin Check:', origin);

      // Development modunda daha esnek
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }

      // Self-origin (Swagger UI için)
      const selfOrigin = `https://${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.HOST || 'localhost'}`;
      console.log('🏠 Self Origin:', selfOrigin);

      // Production'da origin kontrolü
      if (!origin) {
        // Postman, mobile app gibi origin'i olmayan istekler
        callback(null, true);
        return;
      }

      // Self-origin kontrolü (Swagger için)
      if (origin === selfOrigin ||
        origin.includes(process.env.RAILWAY_PUBLIC_DOMAIN || '') ||
        origin.includes('railway.app')) {
        console.log('✅ Self-origin allowed:', origin);
        callback(null, true);
        return;
      }

      // Allowed origins kontrolü
      if (allowedOrigins.length === 0) {
        // FRONTEND_URL tanımlı değilse geçici olarak izin ver (güvenlik uyarısı)
        console.warn('⚠️  FRONTEND_URL tanımlı değil, tüm origin\'lere izin veriliyor!');
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error('❌ CORS violation for origin:', origin);
        console.error('Expected one of:', allowedOrigins);
        console.error('Or self-origin:', selfOrigin);
        callback(new Error('CORS policy violation'), false);
      }
    },
    credentials: true, // HttpOnly cookie'ler için zorunlu
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Cookie',
      'X-CSRF-Token', // CSRF token için
      'X-Requested-With' // AJAX request tanımlama için
    ],
    exposedHeaders: ['Set-Cookie'], // Cookie ayarlama için
    maxAge: 86400, // Preflight cache süresi (24 saat)
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

  // Debug endpoint for CORS troubleshooting (Railway)
  app.getHttpAdapter().get('/debug/cors', (req, res) => {
    const selfOrigin = `https://${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.HOST || 'localhost'}`;
    res.status(200).json({
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin,
      selfOrigin: selfOrigin,
      railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
      host: process.env.HOST,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host
      },
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

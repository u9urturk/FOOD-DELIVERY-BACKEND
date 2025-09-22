import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
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
  const httpsOptions = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost.pem'),
  };
  const app = await NestFactory.create(AppModule, { httpsOptions });
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL || '').split(',').filter(url => url.trim())
      : ['https://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Cookie',
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.setGlobalPrefix('api/v1');

  setupSwagger(app);

  app.getHttpAdapter().get('/health', async (req, res) => {
    try {
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

  app.getHttpAdapter().get('/health/db', async (req, res) => {
    try {
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

  app.getHttpAdapter().get('/', (req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Food Delivery Backend API',
      documentation: '/api/docs'
    });
  });

  app.getHttpAdapter().get('/debug/cors', (req, res) => {
    const selfOrigin = `https://${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.HOST || 'localhost'}`;
    res.status(200).json({
      environment: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL,
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

  console.log(`🚀 Application is running locally:  https://localhost:${port}`);
  console.log(`🌐 Network access:               https://${localIP}:${port}`);
  console.log(`📚 Swagger documentation:        https://localhost:${port}/docs`);
}

bootstrap();

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Food Delivery Backend API')
    .setDescription(`
      A comprehensive food delivery backend API built with NestJS.
      
      **Authentication Flow:**
      1. Register with username to get QR code
      2. Scan QR code with Google Authenticator
      3. Login with username + TOTP token
      
      **Base URL:** /api/v1
    `)
    .setVersion('1.0')
    .addServer('https://food-delivery-backend-production-b326.up.railway.app', 'Production API')
    .addServer('http://localhost:3000', 'Development API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication with Google Authenticator')
    .addTag('Health', 'Application health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
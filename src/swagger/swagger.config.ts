import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const builder = new DocumentBuilder()
    .setTitle('Food Delivery Backend API')
    .setDescription(`\nFood Delivery Backend API (Cookie Based Auth Mode)\n\nGlobal prefix: /api/v1\n`)
    .setVersion(process.env.APP_VERSION || '1.0.0')
    .addTag('Authentication', 'Cookie tabanlı kimlik doğrulama')
    .addTag('Health', 'Health checks')
    .addBearerAuth()

  builder.addServer('/', 'Current origin');

  if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || '3000';
    builder.addServer(`http://localhost:${port}`, 'Local development');
  }

  if (process.env.PUBLIC_BASE_URL) {
    builder.addServer(process.env.PUBLIC_BASE_URL, 'Public base URL');
  } else {
    builder.addServer('https://food-delivery-backend-production-b326.up.railway.app', 'Sample Production');
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
    jsonDocumentUrl: 'docs-json',
  });
}
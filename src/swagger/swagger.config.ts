import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const builder = new DocumentBuilder()
    .setTitle('Food Delivery Backend API')
    .setDescription(`\nFood Delivery Backend API (Cookie Based Auth Mode)\n\nAuth Akışı (Cookie Only):\n- /auth/login -> HttpOnly access_token (kısa ömür) + refresh_token (uzun ömür) cookie\n- /auth/refresh -> access token yeniler, refresh token rotate eder\n- /auth/logout -> tüm auth cookie'leri temizler\n\nNOT: Authorization: Bearer header kullanılmaz. Swagger üzerinden test ederken "Try it out" sonrası response Set-Cookie başlıklarını tarayıcı (Swagger UI) otomatik gönderir (withCredentials).\n\nCSRF: Eğer CROSS_SITE_COOKIES=true ise /auth/csrf endpointinden token alın ve X-CSRF-Token header'ı ile gönderin.\n\nGlobal prefix: /api/v1\n`)
    .setVersion(process.env.APP_VERSION || '1.0.0')
  .addTag('Authentication', 'Cookie tabanlı kimlik doğrulama (Bearer header kaldırıldı)')
    .addTag('Health', 'Health checks');

  // Always include a relative server first (prevents mixed content / CORS confusion)
  builder.addServer('/', 'Current origin');

  // Local dev server (only if in dev and port known)
  if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || '3000';
    builder.addServer(`http://localhost:${port}`, 'Local development');
  }

  // Optional production server(s) from env to avoid hard-coding
  if (process.env.PUBLIC_BASE_URL) {
    builder.addServer(process.env.PUBLIC_BASE_URL, 'Public base URL');
  } else {
    // fallback existing sample (can be removed if not valid for your deployment)
    builder.addServer('https://food-delivery-backend-production-b326.up.railway.app', 'Sample Production');
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
    jsonDocumentUrl: 'docs-json', // accessible at /docs-json
  });
}
jest.setTimeout(15000);
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Auth Flow (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let refreshCookie: string;
  let accessToken: string;

  const testUser = {
    username: 'u9urturk',
    token: '751858', // Test ortamında OTP doğrulaması bypass edilebilir
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
    server = app.getHttpServer();
    // Kayıt işlemi kaldırıldı, testUser veritabanında hazır olmalı
  });

  afterAll(async () => {
    await app.close();
  });

  it('Login: access_token JSON ve refresh cookie dönmeli', async () => {
    const res = await request(server)
  .post('/api/v1/auth/login')
      .send(testUser)
      .expect(200);
    expect(res.body.access_token).toBeDefined();
    accessToken = res.body.access_token;
    // Refresh cookie kontrolü
    const setCookieHeader = res.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    const setCookieArr = typeof setCookieHeader === 'string' ? [setCookieHeader] : setCookieHeader;
    const refresh = setCookieArr.find((c: string) => c.startsWith('refresh_token='));
    expect(refresh).toBeDefined();
    refreshCookie = refresh as string;
  });

  it('Protected route: Bearer olmadan 401 dönmeli', async () => {
    await request(server)
  .post('/api/v1/auth/profile')
      .expect(401);
  });

  it('Protected route: Doğru Bearer ile başarılı', async () => {
    const res = await request(server)
  .post('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.username).toBe(testUser.username);
  });

  it('Refresh: Cookie ile yeni access_token dönmeli', async () => {
    const res = await request(server)
  .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);
    expect(res.body.access_token).toBeDefined();
    accessToken = res.body.access_token;
    // Yeni refresh cookie de set edilmeli
    const setCookieHeader = res.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    const setCookieArr = typeof setCookieHeader === 'string' ? [setCookieHeader] : setCookieHeader;
    const refresh = setCookieArr.find((c: string) => c.startsWith('refresh_token='));
    expect(refresh).toBeDefined();
    refreshCookie = refresh as string;
  });

  it('Logout: Refresh cookie temizlenmeli', async () => {
    await request(server)
  .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', refreshCookie)
      .expect(200);
  });

  it('Logout sonrası refresh ile yeni access_token alınamamalı (401)', async () => {
    await request(server)
  .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);
  });
});

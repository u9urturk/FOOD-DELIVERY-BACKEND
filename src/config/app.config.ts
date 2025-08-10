import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  name: process.env.APP_NAME || 'Food Delivery Backend',
  version: process.env.APP_VERSION || '1.0.0',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // OTP
  otp: {
    window: parseInt(process.env.OTP_WINDOW || '1', 10),
    step: parseInt(process.env.OTP_STEP || '30', 10),
    digits: parseInt(process.env.OTP_DIGITS || '6', 10),
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '5', 10),
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // Upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10),
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/png'],
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    helmetEnabled: process.env.HELMET_ENABLED === 'true',
    compressionEnabled: process.env.COMPRESSION_ENABLED === 'true',
  },

  // Monitoring
  monitoring: {
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  },

  // Development
  development: {
    seedDatabase: process.env.SEED_DATABASE === 'true',
    debugSQL: process.env.DEBUG_SQL === 'true',
    prismaStudioPort: parseInt(process.env.PRISMA_STUDIO_PORT || '5555', 10),
  },
}));

import { registerAs } from '@nestjs/config';
import { IsString, IsNumber, IsBoolean, IsOptional, IsUrl, IsEnum, IsIn, validateSync } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  // ===========================================
  // Application Configuration
  // ===========================================
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number;

  @IsString()
  APP_NAME: string;

  @IsString()
  APP_VERSION: string;

  // ===========================================
  // Database Configuration
  // ===========================================
  @IsUrl({ require_tld: false })
  DATABASE_URL: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  DATABASE_MAX_CONNECTIONS?: number = 10;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  DATABASE_TIMEOUT?: number = 20000;

  // ===========================================
  // Redis Configuration
  // ===========================================
  @IsUrl({ require_tld: false })
  REDIS_URL: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  REDIS_TTL?: number = 3600;

  // ===========================================
  // JWT Configuration
  // ===========================================
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string = '7d';

  // ===========================================
  // OTP Configuration
  // ===========================================
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  OTP_WINDOW?: number = 1;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  OTP_STEP?: number = 30;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  OTP_DIGITS?: number = 6;

  // ===========================================
  // Rate Limiting Configuration
  // ===========================================
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  THROTTLE_TTL?: number = 60000;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  THROTTLE_LIMIT?: number = 100;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  THROTTLE_AUTH_LIMIT?: number = 5;

  // ===========================================
  // CORS Configuration
  // ===========================================
  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  // ===========================================
  // Swagger Configuration
  // ===========================================
  @IsString()
  @IsOptional()
  SWAGGER_TITLE?: string = 'Food Delivery API';

  @IsString()
  @IsOptional()
  SWAGGER_DESCRIPTION?: string = 'REST API for Food Delivery Application';

  @IsString()
  @IsOptional()
  SWAGGER_VERSION?: string = '1.0.0';

  @IsString()
  @IsOptional()
  SWAGGER_PATH?: string = 'api';

  // ===========================================
  // Logging Configuration
  // ===========================================
  @IsIn(['error', 'warn', 'info', 'debug', 'verbose'])
  @IsOptional()
  LOG_LEVEL?: string = 'info';

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  LOG_FILE_ENABLED?: boolean = false;

  @IsString()
  @IsOptional()
  LOG_FILE_PATH?: string = './logs';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  LOG_MAX_FILES?: number = 7;

  @IsString()
  @IsOptional()
  LOG_MAX_SIZE?: string = '10m';

  // ===========================================
  // File Upload Configuration
  // ===========================================
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  UPLOAD_MAX_SIZE?: number = 10485760; // 10MB

  @IsString()
  @IsOptional()
  UPLOAD_ALLOWED_TYPES?: string = 'image/jpeg,image/png,image/webp';

  // ===========================================
  // Email Configuration
  // ===========================================
  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  SMTP_PORT?: number = 587;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  SMTP_SECURE?: boolean = false;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASS?: string;

  // ===========================================
  // SMS Configuration
  // ===========================================
  @IsString()
  @IsOptional()
  SMS_PROVIDER?: string;

  @IsString()
  @IsOptional()
  SMS_API_KEY?: string;

  @IsString()
  @IsOptional()
  SMS_API_SECRET?: string;

  @IsString()
  @IsOptional()
  SMS_FROM_NUMBER?: string;

  // ===========================================
  // Security Configuration
  // ===========================================
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  BCRYPT_ROUNDS?: number = 12;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  HELMET_ENABLED?: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  COMPRESSION_ENABLED?: boolean = true;

  // ===========================================
  // Monitoring Configuration
  // ===========================================
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  HEALTH_CHECK_ENABLED?: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  METRICS_ENABLED?: boolean = false;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  METRICS_PORT?: number = 9090;

  // ===========================================
  // External Services
  // ===========================================
  @IsUrl()
  @IsOptional()
  PAYMENT_GATEWAY_URL?: string;

  @IsString()
  @IsOptional()
  PAYMENT_GATEWAY_KEY?: string;

  @IsString()
  @IsOptional()
  MAPS_API_KEY?: string;

  // ===========================================
  // Development Configuration
  // ===========================================
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  SEED_DATABASE?: boolean = false;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  DEBUG_SQL?: boolean = false;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  PRISMA_STUDIO_PORT?: number = 5555;

  // ===========================================
  // Cookie / Auth (Cookie Only Mode) Configuration
  // ===========================================
  @IsString()
  @IsOptional()
  COOKIE_DOMAIN?: string; // Örn: .example.com (opsiyonel)

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  CROSS_SITE_COOKIES?: boolean = false; // true ise SameSite=None + Secure
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map(error => {
      const constraints = Object.values(error.constraints || {});
      return `${error.property}: ${constraints.join(', ')}`;
    });

    throw new Error(`Configuration validation error:\n${errorMessages.join('\n')}`);
  }

  // Additional custom validations
  if (validatedConfig.NODE_ENV === Environment.Production) {
    // Production-specific validations
    if (!validatedConfig.JWT_SECRET || validatedConfig.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }

    if (!validatedConfig.JWT_REFRESH_SECRET || validatedConfig.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }

    if (validatedConfig.JWT_SECRET === validatedConfig.JWT_REFRESH_SECRET) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different in production');
    }

    if (validatedConfig.BCRYPT_ROUNDS && validatedConfig.BCRYPT_ROUNDS < 12) {
      throw new Error('BCRYPT_ROUNDS should be at least 12 in production');
    }

    // Warn about missing optional production services
    const warnings: string[] = [];
    
    if (!validatedConfig.SMTP_HOST) {
      warnings.push('SMTP configuration is missing - email notifications will not work');
    }

    if (!validatedConfig.SMS_API_KEY) {
      warnings.push('SMS configuration is missing - SMS OTP will not work');
    }

    if (warnings.length > 0) {
      console.warn('Production warnings:');
      warnings.forEach(warning => console.warn(`⚠️  ${warning}`));
    }
  }

  return validatedConfig;
}

export default registerAs('app', () => validate(process.env));

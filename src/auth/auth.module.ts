import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { OtpService } from './otp.service';
import { RedisModule } from '../redis/redis.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from 'src/database/database.module';
import { RolesModule } from './roles/roles.module';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { ErrorService } from '../common/services/error.service';
import { ProfileModule } from 'src/modules/profile/profile.module';
import { TokenService } from './token.service';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    RolesModule,
    PassportModule,
    forwardRef(() => ProfileModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('ACCESS_TOKEN_TTL') || configService.get<string>('JWT_EXPIRES_IN') || '10m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, OtpService, JwtStrategy, RateLimitGuard, RolesGuard, ErrorService, TokenService],
  controllers: [AuthController],
  exports: [OtpService],
})
export class AuthModule { }
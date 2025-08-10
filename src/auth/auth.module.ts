import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    RolesModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, OtpService, JwtStrategy, RateLimitGuard, RolesGuard, ErrorService],
  controllers: [AuthController],
})
export class AuthModule { }
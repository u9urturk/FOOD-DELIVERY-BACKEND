import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from './auth/roles/roles.module';
import { PermissionsModule } from './auth/permissions/permissions.module';
import { RedisModule } from './redis/redis.module';
import { CommonModule } from './common/common.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { validate } from './config/env.validation';
import { ProfileModule } from './modules/profile/profile.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      // validate, // Temporarily disabled for testing
      cache: true,
      expandVariables: true,
    }),
    CommonModule,
    AuthModule, 
    RolesModule,
    PermissionsModule,
    RedisModule,
    ProfileModule,
    RealtimeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
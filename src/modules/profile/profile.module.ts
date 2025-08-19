import { Module, forwardRef } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { MfaController } from './mfa/mfa.controller';
import { ProfileService } from './profile.service';
import { MfaService } from './mfa/mfa.service';
import { ActivityLogService } from './activity/activity-log.service';
import { ActivityModule } from './activity/activity.module';
import { SessionService } from './session/session.service';
import { DatabaseModule } from 'src/database/database.module';
import { RedisModule } from 'src/redis/redis.module';
import { AuthModule } from 'src/auth/auth.module';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { ErrorService } from 'src/common/services/error.service';
import { RealtimeModule } from 'src/realtime/realtime.module';

@Module({
  imports: [DatabaseModule, RedisModule, forwardRef(() => AuthModule), RealtimeModule, ActivityModule],
  controllers: [ProfileController, MfaController],
  providers: [ProfileService, ActivityLogService, SessionService, MfaService, RateLimitService, ErrorService],
  exports: [ProfileService, SessionService],
})
export class ProfileModule {}

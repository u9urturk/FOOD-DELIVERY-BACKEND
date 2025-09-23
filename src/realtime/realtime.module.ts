import { Module } from '@nestjs/common';
import { SessionGateway } from './session.gateway';
import { SessionEventsService } from './session-events.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RealtimeAuthService } from './realtime-auth.service';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  providers: [SessionGateway, SessionEventsService, RealtimeAuthService],
  exports: [SessionEventsService],
})
export class RealtimeModule {}

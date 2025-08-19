import { Module } from '@nestjs/common';
import { SessionGateway } from './session.gateway.js';
import { SessionEventsService } from './session-events.service.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  providers: [SessionGateway, SessionEventsService],
  exports: [SessionEventsService],
})
export class RealtimeModule {}

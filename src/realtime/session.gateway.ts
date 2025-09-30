import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SessionEventsService } from './session-events.service';
import { LoggingService } from 'src/common/services/logging.service';
import { Server, Socket } from 'socket.io';
import { RealtimeAuthService } from './realtime-auth.service';

@WebSocketGateway({ path: '/ws', cors: { origin: true, credentials: true } })
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  constructor(
    private readonly events: SessionEventsService,
    private readonly auth: RealtimeAuthService,
    private readonly logger: LoggingService,
  ) {}

  afterInit() {
    this.events.bindServer(this.server);
    this.logger.logInfo('WS gateway initialized', undefined, 'WebSocket');
  }

  handleConnection(client: Socket) {
    const sid = client.id;
    this.logger.logDebug('WS incoming connection', { socketId: sid, ip: client.handshake.address, origin: client.handshake.headers.origin }, 'WebSocket');
    try {
      const meta = this.auth.authenticate(client);
      const accepted = this.events.register(client, meta);
      if (!accepted) {
        this.logger.logWarning('WS connection rejected (rate limit)', { socketId: sid, userId: meta.userId }, 'WebSocket');
        return; 
      }
      this.logger.logInfo('WS connection authorized', { socketId: sid, ...meta }, 'WebSocket');
    } catch (e) {
      this.logger.logWarning('WS connection rejected', { socketId: sid, error: (e as any)?.message }, 'WebSocket');
      client.emit('auth_error', { type: 'auth_error', message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.events.unregister(client);
    this.logger.logDebug('WS disconnected', { socketId: client.id }, 'WebSocket');
  }
}

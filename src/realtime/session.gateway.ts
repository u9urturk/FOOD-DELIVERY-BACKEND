import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionEventsService } from './session-events.service.js';
import { LoggingService } from 'src/common/services/logging.service';
import { UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

function parseCookies(header?: string): Record<string,string> {
  const out: Record<string,string> = {};
  if (!header) return out;
  header.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) {
      const k = p.slice(0,i).trim();
      const v = decodeURIComponent(p.slice(i+1).trim());
      out[k] = v;
    }
  });
  return out;
}

@WebSocketGateway({ path: '/ws', cors: { origin: true, credentials: true } })
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  constructor(private jwt: JwtService, private config: ConfigService, private events: SessionEventsService, private logger: LoggingService) {}

  afterInit() { 
  this.events.bindServer(this.server);
  this.logger.logInfo('WS gateway initialized', undefined, 'WebSocket');
  }

  handleConnection(client: Socket) {
  const sid = client.id;
  this.logger.logDebug('WS incoming connection', { socketId: sid, ip: client.handshake.address, origin: client.handshake.headers.origin }, 'WebSocket');
  try {
    const cookieHeader = client.handshake.headers.cookie as string | undefined;
    const cookies = parseCookies(cookieHeader);
    const token = cookies['access_token'];
    if (!token) throw new UnauthorizedException('no access token');
    const secret = this.config.get<string>('JWT_SECRET');
    const payload: any = this.jwt.verify(token, { secret });
    const sessionId = payload.sessionId || payload.sid;
    if (!payload?.sub || !sessionId) throw new UnauthorizedException('invalid payload');
    this.events.register(client, { userId: payload.sub, sessionId });
    this.logger.logInfo('WS connection authorized', { socketId: sid, userId: payload.sub, sessionId }, 'WebSocket');
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

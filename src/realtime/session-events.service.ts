import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/common/services/logging.service';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

interface SocketMeta { userId: string; sessionId: string; }

@Injectable()
export class SessionEventsService {
    private sessionSockets = new Map<string, Set<Socket>>();
    private userSockets = new Map<string, Set<Socket>>();
    private reverseMeta = new Map<string, SocketMeta>();
    private server?: Server;

    private logSocketMaps(debugOnly = true) {
        const sessionInfo = Array.from(this.sessionSockets.entries()).map(([sid, set]) => ({ sessionId: sid, count: set.size }));
        const userInfo = Array.from(this.userSockets.entries()).map(([uid, set]) => ({ userId: uid, count: set.size }));
        const payload = { sessions: sessionInfo, users: userInfo, totalSockets: this.reverseMeta.size };
        if (debugOnly) {
            this.logger.logDebug('WS state', payload, 'WebSocket');
        } else {
            this.logger.logInfo('WS state', payload, 'WebSocket');
        }

        console.log('WS state', payload); // also log to console for easier visibility
    }

    private readonly maxSocketsPerUser: number;

    constructor(private logger: LoggingService, private config: ConfigService) {
        this.maxSocketsPerUser = Number(this.config.get('REALTIME_MAX_SOCKETS_PER_USER') ?? 5);
    }

    bindServer(server: Server) {
        this.server = server;
        this.logger.logInfo('[WS] server bound', undefined, 'WebSocket');
        this.logSocketMaps();
    }

    register(socket: Socket, meta: SocketMeta): boolean {
        const { sessionId, userId } = meta;
        if (!this.sessionSockets.has(sessionId)) this.sessionSockets.set(sessionId, new Set());
        if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
        const userSet = this.userSockets.get(userId)!;
        if (userSet.size >= this.maxSocketsPerUser) {
            this.logger.logWarning('WS socket limit exceeded', { userId, limit: this.maxSocketsPerUser, incomingSocketId: socket.id }, 'WebSocket');
            socket.emit('rate_limited', { type: 'rate_limited', reason: 'user_socket_limit', limit: this.maxSocketsPerUser });
            setTimeout(() => socket.disconnect(true), 10);
            return false;
        }
        this.sessionSockets.get(sessionId)!.add(socket);
        userSet.add(socket);
        this.reverseMeta.set(socket.id, meta);
        this.logger.logDebug('WS socket registered', { userId, sessionId, socketId: socket.id, sessionSocketCount: this.sessionSockets.get(sessionId)?.size, userSocketCount: userSet.size }, 'WebSocket');
        this.logSocketMaps();
        return true;
    }

    unregister(socket: Socket) {
        const meta = this.reverseMeta.get(socket.id);
        if (!meta) return;
        const { sessionId, userId } = meta;
        this.sessionSockets.get(sessionId)?.delete(socket);
        this.userSockets.get(userId)?.delete(socket);
        this.reverseMeta.delete(socket.id);
        if (this.sessionSockets.get(sessionId)?.size === 0) this.sessionSockets.delete(sessionId);
        if (this.userSockets.get(userId)?.size === 0) this.userSockets.delete(userId);
        this.logger.logDebug('WS socket unregistered', { userId, sessionId, socketId: socket.id }, 'WebSocket');
        this.logSocketMaps();
    }

    emitSessionRevoked(sessionId: string, reason: string) {
        const sockets = this.sessionSockets.get(sessionId);
        if (!sockets) return;
        this.logger.logInfo('WS emit session_revoked', { sessionId, reason, targetSockets: sockets.size }, 'WebSocket');
        const payload = { type: 'session_revoked', sessionId, reason } as const;
        for (const s of sockets) {
            s.emit('session_revoked', payload);
        }
        this.logSocketMaps();
    }

    emitUserBulkRevoked(userId: string, revokedSessionIds: string[], reason: string, excludeSessionId?: string) {
        const sockets = this.userSockets.get(userId);
        if (!sockets) return;
        this.logger.logInfo('WS emit bulk revoke', { userId, revokedSessionCount: revokedSessionIds.length, reason, excludeSessionId }, 'WebSocket');
        for (const s of sockets) {
            const meta = this.reverseMeta.get(s.id)!;
            if (excludeSessionId && meta.sessionId === excludeSessionId) continue;
            if (revokedSessionIds.includes(meta.sessionId)) {
                s.emit('session_revoked', { type: 'session_revoked', sessionId: meta.sessionId, reason });
            }
        }
        this.logSocketMaps();
    }

    getStats() {
        return {
            sessions: this.sessionSockets.size,
            users: this.userSockets.size,
            sockets: this.reverseMeta.size,
        };
    }


}

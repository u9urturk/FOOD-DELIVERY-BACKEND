import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/common/services/logging.service';
import { Server, Socket } from 'socket.io';

interface SocketMeta { userId: string; sessionId: string; }

@Injectable()
export class SessionEventsService {
    private sessionSockets = new Map<string, Set<Socket>>();
    private userSockets = new Map<string, Set<Socket>>();
    private server?: Server;

    private logSocketMaps() {
        const sessionInfo = Array.from(this.sessionSockets.entries()).map(([sid, set]) => ({ sessionId: sid, count: set.size }));
        const userInfo = Array.from(this.userSockets.entries()).map(([uid, set]) => ({ userId: uid, count: set.size }));
        // Konsola yazdır
        console.log('[WS] sessionSockets:', sessionInfo);
        console.log('[WS] userSockets:', userInfo);
    }

    constructor(private logger: LoggingService) { }

    bindServer(server: Server) {
        this.server = server;
        this.logger.logInfo('[WS] server bound', undefined, 'WebSocket');
        this.logSocketMaps();
    }

    register(socket: Socket, meta: SocketMeta) {
        const { sessionId, userId } = meta;
        if (!this.sessionSockets.has(sessionId)) this.sessionSockets.set(sessionId, new Set());
        if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
        this.sessionSockets.get(sessionId)!.add(socket);
        this.userSockets.get(userId)!.add(socket);
        (socket as any).meta = meta;
        this.logger.logDebug('WS socket registered', { userId, sessionId, socketId: socket.id, cnt: this.sessionSockets.get(sessionId)?.size }, 'WebSocket');
        this.logSocketMaps();
    }

    unregister(socket: Socket) {
        const meta = (socket as any).meta as SocketMeta | undefined;
        if (!meta) return;
        const { sessionId, userId } = meta;
        this.sessionSockets.get(sessionId)?.delete(socket);
        this.userSockets.get(userId)?.delete(socket);
        if (this.sessionSockets.get(sessionId)?.size === 0) this.sessionSockets.delete(sessionId);
        if (this.userSockets.get(userId)?.size === 0) this.userSockets.delete(userId);
        this.logger.logDebug('WS socket unregistered', { userId, sessionId, socketId: socket.id }, 'WebSocket');
        this.logSocketMaps();
    }

    emitSessionRevoked(sessionId: string, reason: string) {
        const sockets = this.sessionSockets.get(sessionId);
        if (!sockets) return;
        this.logger.logInfo('WS emit session_revoked', { sessionId, reason, targetSockets: sockets.size }, 'WebSocket');
        for (const s of sockets) {
            s.emit('session_revoked', { type: 'session_revoked', sessionId, reason });
        }
        this.logSocketMaps();
    }

    emitUserBulkRevoked(userId: string, revokedSessionIds: string[], reason: string, excludeSessionId?: string) {
        const sockets = this.userSockets.get(userId);
        if (!sockets) return;
        this.logger.logInfo('WS emit bulk revoke', { userId, revokedSessionCount: revokedSessionIds.length, reason, excludeSessionId }, 'WebSocket');
        for (const s of sockets) {
            const meta = (s as any).meta as SocketMeta;
            if (excludeSessionId && meta.sessionId === excludeSessionId) continue;
            if (revokedSessionIds.includes(meta.sessionId)) {
                s.emit('session_revoked', { type: 'session_revoked', sessionId: meta.sessionId, reason });
            }
        }
        this.logSocketMaps();
    }
}

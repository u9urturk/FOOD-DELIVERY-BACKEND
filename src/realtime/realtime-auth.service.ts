import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { LoggingService } from 'src/common/services/logging.service';

interface TokenPayload { sub: string; sessionId?: string; sid?: string; [k: string]: any }

interface JwtHeader { alg?: string; typ?: string; kid?: string; [k: string]: any }

function safeBase64JsonDecode(segment: string): any | undefined {
    try {
        const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
        const json = Buffer.from(normalized, 'base64').toString('utf8');
        return JSON.parse(json);
    } catch {
        return undefined;
    }
}

@Injectable()
export class RealtimeAuthService {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
        private readonly logger: LoggingService,
    ) { }

    authenticate(client: Socket): { userId: string; sessionId: string } {
        const authHeader = client.handshake.headers['authorization'] as string | undefined;
        let token: string | undefined;

        if (authHeader && /^bearer /i.test(authHeader)) {
            token = authHeader.replace(/^bearer /i, '').trim();
        }

        if (!token) {
            token = (client.handshake.auth?.accessToken as string | undefined)
                || (client.handshake.auth?.token as string | undefined)
                || (client.handshake.query?.accessToken as string | undefined)
                || (client.handshake.query?.token as string | undefined);
        }

        if (!token) {
            this.logger.logWarning('WS missing access token', { socketId: client.id }, 'WebSocket');
            throw new UnauthorizedException('missing access token');
        }

        const secret = this.selectSecret(token, client.id);
        let payload: TokenPayload;
        try {
            payload = this.jwt.verify<TokenPayload>(token, { secret });
        } catch (e) {
            this.logger.logWarning('WS token verification failed', { socketId: client.id, error: (e as any)?.message }, 'WebSocket');
            throw new UnauthorizedException('invalid token');
        }

        const sessionId = payload.sessionId || payload.sid;
        if (!payload.sub || !sessionId) {
            this.logger.logWarning('WS invalid token payload', { socketId: client.id }, 'WebSocket');
            throw new UnauthorizedException('invalid payload');
        }
        return { userId: payload.sub, sessionId };
    }

    private parsedSecrets?: Record<string, string>;

    private buildSecretsMap(): Record<string, string> {
        if (this.parsedSecrets) return this.parsedSecrets;
        const map: Record<string, string> = {};
        const raw = this.config.get<string>('JWT_SECRET');
        if (raw) {
            raw.split(/[;,]/).map(s => s.trim()).filter(Boolean).forEach(entry => {
                const idx = entry.indexOf('=');
                if (idx > 0) {
                    const kid = entry.slice(0, idx).trim();
                    const val = entry.slice(idx + 1).trim();
                    if (kid && val) map[kid] = val;
                }
            });
        }
        const def = this.config.get<string>('JWT_SECRET');
        if (def && !map['default']) map['default'] = def;
        this.parsedSecrets = map;
        return map;
    }

    private selectSecret(token: string, socketId: string): string {
        const parts = token.split('.');
        if (parts.length !== 3) throw new UnauthorizedException('malformed token');
        const header = safeBase64JsonDecode(parts[0]) as JwtHeader | undefined;
        const kid = header?.kid;
        const secrets = this.buildSecretsMap();
        if (kid && secrets[kid]) return secrets[kid];
        if (kid && !secrets[kid]) {
            this.logger.logWarning('WS unknown kid, falling back to default', { socketId, kid }, 'WebSocket');
        }
        const fallback = secrets[kid || 'default'] || secrets['default'];
        if (!fallback) throw new UnauthorizedException('no secret configured');
        return fallback;
    }
}

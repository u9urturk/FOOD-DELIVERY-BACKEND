import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ActivityLogService } from '../activity/activity-log.service';
import { SessionEventsService } from 'src/realtime/session-events.service';

interface CreateSessionParams {
  userId: string;
  userAgent?: string;
  ip?: string;
  ttlDays?: number; // default 7
}

@Injectable()
export class SessionService {
  constructor(
    private prisma: DatabaseService,
    private errorService: ErrorService,
    private activity: ActivityLogService,
    private sessionEvents: SessionEventsService,
  ) { }



  async generateAndStore(params: CreateSessionParams) {
    const { userId, userAgent, ip, ttlDays = 7 } = params;
    // Yeni format: <sessionId>.<random>
    const rawRandom = crypto.randomBytes(48).toString('hex');
    const hash = await bcrypt.hash(rawRandom, 12);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    // create session
    const session = await this.prisma.session.create({
      data: {
        userId,
        userAgent,
        ip,
        expiresAt,
      },
      select: { id: true, createdAt: true, expiresAt: true },
    });
    // store refresh token hash in separate table
    await this.prisma.refreshToken.create({
      data: {
        sessionId: session.id,
        tokenHash: hash,
        expiresAt,
        ip,
        userAgent,
      },
    });
    const composite = `${session.id}.${rawRandom}`;
    return { sessionId: session.id, refreshToken: composite, expiresAt: session.expiresAt };
  }

  async list(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        ip: true,
        userAgent: true,
        revokedAt: true,
        revokedReason: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async revoke(userId: string, sessionId: string, reason = 'manual') {
    try {
      const session = await this.prisma.session.findUnique({ where: { id: sessionId }, select: { userId: true, revokedAt: true } });
      if (!session || session.userId !== userId) this.errorService.throwNotFound('Oturum');
      if (session.revokedAt) return { message: 'Oturum zaten iptal edilmiş' };
      await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date(), revokedReason: reason } });
      // revoke related refresh tokens
      await this.prisma.refreshToken.updateMany({ where: { sessionId }, data: { revokedAt: new Date(), revokedReason: reason } });
      this.activity.log(userId, 'SESSION_REVOKE', { sessionId });
      // realtime broadcast
      this.sessionEvents.emitSessionRevoked(sessionId, reason);
      return { message: 'Oturum iptal edildi' };
    } catch (error) {
      this.errorService.handleError(error, 'session revoke');
    }
  }

  async revokeAll(userId: string, excludeSessionId?: string) {
    try {
      await this.prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(excludeSessionId && { id: { not: excludeSessionId } }),
        },
        data: { revokedAt: new Date(), revokedReason: 'bulk' },
      });
      // revoke refresh tokens for affected sessions
      const sessionsToRevoke = await this.prisma.session.findMany({ where: { userId, revokedAt: { not: null } }, select: { id: true } });
      const ids = sessionsToRevoke.map(s => s.id);
      if (ids.length) {
        await this.prisma.refreshToken.updateMany({ where: { sessionId: { in: ids } }, data: { revokedAt: new Date(), revokedReason: 'bulk' } });
      }
      this.activity.log(userId, 'SESSION_REVOKE', { bulk: true });
      // broadcast each revoked session except excluded
      const revokedIds = ids.filter(id => !excludeSessionId || id !== excludeSessionId);
      if (revokedIds.length) this.sessionEvents.emitUserBulkRevoked(userId, revokedIds, 'bulk', excludeSessionId);
      return { message: 'Tüm oturumlar iptal edildi' };
    } catch (error) {
      this.errorService.handleError(error, 'tüm oturumları iptal etme');
    }
  }

  async verifyAndRotate(userId: string, sessionId: string, presentedToken: string, ttlDays = 7) {
    // Groundwork: will be integrated into refresh endpoint later
    try {
      const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== userId) this.errorService.throwNotFound('Oturum');
      if (session.revokedAt || session.expiresAt < new Date()) this.errorService.throwInvalidToken();
      // find refresh token row by hash
      // Lookup candidates by comparing bcrypt (no direct lookup by hash because of salt)
      // Search recent tokens for session and compare using bcrypt.compare
      // Token format beklenen: <sessionId>.<random>
      let randomPart = presentedToken;
      if (presentedToken.includes('.')) {
        const [prefix, rand] = presentedToken.split('.', 2);
        if (prefix !== sessionId) {
          // yanlış oturum id'si -> reuse / saldırı say
          await this.revoke(userId, sessionId, 'invalid_prefix');
          this.errorService.throwInvalidToken();
        }
        randomPart = rand;
      } else {
        // Eski format desteklenmiyor: direkt reddet
        this.errorService.throwInvalidToken();
      }
      const tokens = await this.prisma.refreshToken.findMany({ where: { sessionId }, orderBy: { createdAt: 'desc' }, take: 10 });
      let found = null as any;
      for (const row of tokens) {
        const match = await bcrypt.compare(randomPart, row.tokenHash);
        if (match) {
          found = row;
          break;
        }
      }
      if (!found) {
        // token reuse or invalid: revoke all for session and alert
        await this.revoke(userId, sessionId, 'invalid_or_reuse');
        this.activity.log(userId, 'REFRESH_REUSE_DETECTED', { sessionId });
        // additional alert/log for ops: non-fatal logging so flow can be observed
        this.errorService.logAndContinue(new Error(`REFRESH_REUSE_DETECTED user=${userId} session=${sessionId}`), 'refresh reuse detected');
        this.errorService.throwInvalidToken();
      }
      if (found.revokedAt || (found.expiresAt && found.expiresAt < new Date())) {
        // reuse detection: this token was already revoked or expired
        await this.revoke(userId, sessionId, 'reuse_detected');
        this.activity.log(userId, 'REFRESH_REUSE_DETECTED', { sessionId });
        // alert/log for ops
        this.errorService.logAndContinue(new Error(`REFRESH_REUSE_DETECTED(reused) user=${userId} session=${sessionId} tokenId=${found.id}`), 'refresh reuse detected');
        this.errorService.throwInvalidToken();
      }
      // valid: rotate — insert new token row and mark old as replaced
      const newRandom = crypto.randomBytes(48).toString('hex');
      const newHash = await bcrypt.hash(newRandom, 12);
      const newExpires = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
      const newRow = await this.prisma.refreshToken.create({ data: { sessionId, tokenHash: newHash, expiresAt: newExpires, ip: session.ip, userAgent: session.userAgent } });
      await this.prisma.refreshToken.update({ where: { id: found.id }, data: { replacedBy: newRow.id, revokedAt: new Date(), revokedReason: 'rotated' } });
      return { refreshToken: `${sessionId}.${newRandom}`, expiresAt: newExpires };
    } catch (error) {
      this.errorService.handleError(error, 'refresh token yenileme');
    }
  }
}

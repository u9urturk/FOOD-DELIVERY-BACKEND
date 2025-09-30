import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
// Temporary local type until Prisma client regeneration ensures enum export
export type UserActivityAction =
  | 'PROFILE_UPDATE'
  | 'PASSWORD_CHANGE'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'SESSION_REVOKE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'REFRESH_REUSE_DETECTED'
  | 'EMAIL_CHANGE_REQUEST'
  | 'EMAIL_CHANGE_CONFIRM';

@Injectable()
export class ActivityLogService {
  constructor(
    private prisma: DatabaseService,
    private errorService: ErrorService,
  ) {}

  async log(userId: string | null, action: UserActivityAction, context?: any, ip?: string, userAgent?: string) {
    try {
      const prismaAny: any = this.prisma;
      await prismaAny.userActivityLog.create({
        data: {
          userId: userId || undefined,
          action,
          context: context ? context : undefined,
          ip,
          userAgent,
        },
      });
    } catch (error) {
      this.errorService.logAndContinue(error, 'activity log create');
    }
  }

  async list(userId: string, cursor?: string, limit = 20) {
    const prismaAny: any = this.prisma;
    return prismaAny.userActivityLog.findMany({
      where: { userId },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
    });
  }
}

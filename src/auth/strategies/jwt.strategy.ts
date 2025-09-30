import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { LoggingService } from 'src/common/services/logging.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: DatabaseService,
    private logger: LoggingService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set. Please check your environment configuration.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
  const prismaAny: any = this.prisma;
  const user = await prismaAny.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.logSecurityEvent('invalid_token', { userId: payload.sub });
      throw new Error('User not found');
    }

    // Extract role names
    const roles = user.userRoles.map((userRole) => userRole.role.name);

    const sessionId = payload.sid;
    this.logger.logDebug('JWT validate success', { userId: user.id, sessionId }, 'JwtStrategy');
    return {
      userId: user.id,
      username: user.username,
      roles,
      sessionId,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
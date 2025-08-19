import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AccessTokenPayload {
  sub: string; // user id
  username: string;
  roles: string[];
  sid: string; // session id
}

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  buildPayload(params: { userId: string; username: string; roles: string[]; sessionId: string }): AccessTokenPayload {
    const { userId, username, roles, sessionId } = params;
    return { sub: userId, username, roles, sid: sessionId };
  }

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(payload);
  }
}

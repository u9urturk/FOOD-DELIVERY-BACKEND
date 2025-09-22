import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TokenBlacklistService } from "src/redis/tokenblacklist.servise";

@Injectable()
export class BlacklistGuard implements CanActivate {
    constructor(
        private jwt: JwtService,
        private blacklist: TokenBlacklistService,
    ) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx.switchToHttp().getRequest();
        const auth = req.headers['authorization'];
        if (!auth) return true;

        const token = auth.split(' ')[1];
        const decoded: any = this.jwt.decode(token);

        if (decoded?.jti) {
            const isBlack = await this.blacklist.isBlacklisted(decoded.jti);
            if (isBlack) throw new UnauthorizedException('Token revoked');
        }

        return true;
    }
}

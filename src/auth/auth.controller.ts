import { Controller, Post, Body, Req, UseGuards, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RecoveryDto } from './dto/recovery.dto';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ErrorResponseDto } from '../common/dto/response.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { TokenService } from './token.service';
import { BlacklistGuard } from 'src/common/guards/black-list.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) { }

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({
    status: 409,
    description: 'Username already exists.',
    type: ErrorResponseDto,
    example: {
      success: false,
      timestamp: '2024-08-07T10:30:00.000Z',
      path: '/auth/register',
      method: 'POST',
      statusCode: 409,
      error: 'Conflict',
      message: 'Bu kullanıcı adı zaten kullanımda',
      requestId: 'req_123456789'
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
    type: ErrorResponseDto
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'User login with OTP', description: 'Modern Access/Refresh token + Bearer mimarisi ile giriş.' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'User not found.', type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests.', type: ErrorResponseDto })
  @UseGuards(RateLimitGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: any) {

    const userAgent = req.headers?.['user-agent'] || req.get?.('User-Agent') || 'unknown';
    const result = await this.authService.login(loginDto, req.ip, userAgent);
    const { refresh_token, user, session_id } = result as any;

    if (refresh_token) this.setRefreshCookie(res, refresh_token, result.refresh_expires_at);

    const { user: _u, refresh_token: _r, ...rest } = result as any;

    if (user && session_id) {
      const payload = this.tokenService.buildPayload({ userId: user.id, username: user.username, roles: user.roles, sessionId: session_id });
      const signed = this.tokenService.signAccessToken(payload);
      return { ...rest, access_token: signed };
    }
    return { ...rest };
  }

  @ApiOperation({ summary: 'User login with recovery code' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.', type: ProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(RateLimitGuard)
  @Post('login-recovery')
  async loginWithRecoveryCode(@Body() recoveryDto: RecoveryDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const userAgent = req.headers?.['user-agent'] || req.get?.('User-Agent') || 'unknown';
    const result = await this.authService.loginWithRecoveryCode(recoveryDto, req.ip, userAgent);
    const { refresh_token, user, session_id } = result as any;
    if (refresh_token) this.setRefreshCookie(res, refresh_token, result.refresh_expires_at);
    if (user && session_id) {
      const payload = this.tokenService.buildPayload({ userId: user.id, username: user.username, roles: user.roles, sessionId: session_id });
      const signed = this.tokenService.signAccessToken(payload);
      return { ...result, access_token: signed };
    }
    return result;
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlacklistGuard)
  @Post('profile')
  getProfile(@Req() req: any): ProfileResponseDto {
    return req.user;
  }

  @ApiOperation({ summary: 'Refresh access & refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const composite = req.cookies?.refresh_token;
    const result = await this.authService.refreshTokensFromCookie(composite, req.ip);
    const { rotated_refresh_token, user, session_id } = result as any;
    if (rotated_refresh_token) this.setRefreshCookie(res, rotated_refresh_token, result.refresh_expires_at);
    if (user && session_id) {
      const payload = this.tokenService.buildPayload({ userId: user.id, username: user.username, roles: user.roles, sessionId: session_id });
      const signed = this.tokenService.signAccessToken(payload);
      return { ...result, access_token: signed };
    }
    return result;
  }

  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.', type: ErrorResponseDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlacklistGuard)
  @Post('logout')
  async logout(@GetUser('userId') userId: string,
    @GetUser('jti') jti: string,
    @GetUser('sessionId') sessionId: string,
    @GetUser('exp') exp: number,
    @Req() req: any, @Res({ passthrough: true }) res: any) {
    try {
      const result = await this.authService.logout(userId, sessionId, jti, exp);
      this.clearAuthCookies(res);
      return result;
    } catch (error) {
      this.clearAuthCookies(res);
      throw error;
    }
  }

  private cookieBaseOptions(maxAgeMs?: number) {
    const crossSite = process.env.CROSS_SITE_COOKIES === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction || crossSite;
    const sameSite = (crossSite ? 'None' : 'Lax') as any;

    const configuredDomain = process.env.COOKIE_DOMAIN || undefined;
    const lower = configuredDomain?.toLowerCase();
    const isLocalDomain = !configuredDomain || ['localhost', '127.0.0.1', '::1'].includes(lower || '');
    const domain = isLocalDomain ? undefined : configuredDomain;

    return {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      maxAge: maxAgeMs || 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }

  private setRefreshCookie(res: any, token: string, expiresAt: Date) {
    const ttl = new Date(expiresAt).getTime() - Date.now();
    const options = this.cookieBaseOptions(ttl);
    res.cookie('refresh_token', token, options);

  }

  private clearAuthCookies(res: any) {
    res.clearCookie('refresh_token');
  }


}
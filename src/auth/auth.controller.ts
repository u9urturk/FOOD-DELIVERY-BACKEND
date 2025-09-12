// src/auth/auth.controller.ts
import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { CsrfGuard } from 'src/common/guards/csrf.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RecoveryDto } from './dto/recovery.dto';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ErrorResponseDto } from '../common/dto/response.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CsrfService } from './csrf.service';
import { TokenService } from './token.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private csrf: CsrfService, private tokenService: TokenService) { }

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

  @ApiOperation({ summary: 'User login with OTP' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.', type: AuthResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
    type: ErrorResponseDto,
    example: {
      success: false,
      timestamp: '2024-08-07T10:30:00.000Z',
      path: '/auth/login',
      method: 'POST',
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Geçersiz doğrulama kodu',
      requestId: 'req_123456789'
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    type: ErrorResponseDto
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests.',
    type: ErrorResponseDto
  })
  @UseGuards(RateLimitGuard, CsrfGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const userAgent = req.headers?.['user-agent'] || req.get?.('User-Agent') || 'unknown';
    const result = await this.authService.login(loginDto, req.ip, userAgent);
    // access token artık controller içinde TokenService ile üretilecek (aşağıda)
    const { refresh_token, user, session_id } = result as any;
    if (refresh_token) this.setRefreshCookie(req, refresh_token, result.refresh_expires_at);
    if (user && session_id) {
      const payload = this.tokenService.buildPayload({ userId: user.id, username: user.username, roles: user.roles, sessionId: session_id });
      const signed = this.tokenService.signAccessToken(payload);
      this.setAccessCookie(req, signed);
    }
    const { user: _u, refresh_token: _r, ...rest } = result as any;
    return { ...rest };
  }

  @ApiOperation({ summary: 'User login with recovery code' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully.',
    type: ProfileResponseDto
  }) @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(RateLimitGuard, CsrfGuard)
  @Post('login-recovery')
  async loginWithRecoveryCode(@Body() recoveryDto: RecoveryDto, @Req() req: any) {
    const userAgent = req.headers?.['user-agent'] || req.get?.('User-Agent') || 'unknown';
    return this.authService.loginWithRecoveryCode(recoveryDto, req.ip, userAgent);
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Req() req: any): ProfileResponseDto {
    return req.user;
  }

  @ApiOperation({ summary: 'Refresh access & refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  @UseGuards(CsrfGuard)
  @Post('refresh')
  async refresh(@Req() req: any) {
    const composite = req.cookies?.refresh_token;
    const result = await this.authService.refreshTokensFromCookie(composite, req.ip);
    // access token controller içinde TokenService ile üretilecek
    const { rotated_refresh_token, user, session_id } = result as any;
    if (rotated_refresh_token) this.setRefreshCookie(req, rotated_refresh_token, result.refresh_expires_at);
    if (user && session_id) {
      const payload = this.tokenService.buildPayload({ userId: user.id, username: user.username, roles: user.roles, sessionId: session_id });
      const signed = this.tokenService.signAccessToken(payload);
      this.setAccessCookie(req, signed);
    }
    const { user: _u, rotated_refresh_token: _rr, ...rest } = result as any;
    return { ...rest };
  }

  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.', type: ErrorResponseDto })
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @Post('logout')
  async logout(@GetUser('userId') userId: string, @GetUser('sessionId') sessionId: string, @Req() req: any) {
    const result = await this.authService.logout(userId, sessionId);
    this.clearAuthCookies(req);
    return result;
  }

  private cookieBaseOptions(maxAgeMs?: number) {
    const crossSite = process.env.CROSS_SITE_COOKIES === 'true';
    const sameSite = crossSite ? 'None' : 'Strict';
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || crossSite,
      sameSite: sameSite as any,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
      ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
    };
  }

  private setAccessCookie(req: any, token: string) {
    const raw = process.env.ACCESS_TOKEN_TTL || process.env.JWT_EXPIRES_IN || '600s';
    const accessMs = this.parseDurationToMs(raw, 600_000); // default 10m
    req.res.cookie('access_token', token, { ...this.cookieBaseOptions(accessMs) });
  }

  private parseDurationToMs(input: string, fallback: number): number {
    if (!input) return fallback;
    const match = /^([0-9]+)([smhd]?)$/i.exec(input.trim());
    if (!match) return fallback;
    const value = parseInt(match[1], 10);
    const unit = match[2]?.toLowerCase() || 's';
    const mult: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return value * (mult[unit] || 1000);
  }

  private setRefreshCookie(req: any, token: string, expiresAt: Date) {
    const maxAgeRefresh = expiresAt ? new Date(expiresAt).getTime() - Date.now() : undefined;
    req.res.cookie('refresh_token', token, { ...this.cookieBaseOptions(maxAgeRefresh) });
  }

  private clearAuthCookies(req: any) {
    try {
      const base = this.cookieBaseOptions(0);
      req.res.cookie('access_token', '', { ...base, maxAge: 0 });
      req.res.cookie('refresh_token', '', { ...base, maxAge: 0 });
    } catch (e) { /* ignore */ }
  }

  @Get('csrf')
  getCsrf(@Req() req: any) {
    try {
      const token = this.csrf.generateToken();
      
      // CORS headers için explicit setting
      req.res.header('Access-Control-Allow-Origin', req.headers.origin);
      req.res.header('Access-Control-Allow-Credentials', 'true');
      req.res.header('Content-Type', 'application/json');
      
      // Safari için multiple cookie setting
      req.res.cookie('csrf_header_token', token, {
        httpOnly: false, // Safari için önemli!
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Safari compatibility
        maxAge: 300000, // 5 minutes
        path: '/'
      });
      
      // Alternative cookie names
      req.res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300000,
        path: '/'
      });
      
      // Main CSRF cookie
      req.res.cookie('csrf_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 300000,
      });
      
      // JSON response (önemli!)
      return {
        success: true,
        csrfToken: token,
        token: token,
        _token: token
      };
      
    } catch (error) {
      console.error('CSRF endpoint error:', error);
      req.res.status(500);
      return {
        success: false,
        message: 'Failed to generate CSRF token'
      };
    }
  }
}
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
  constructor(
    private authService: AuthService, 
    private csrf: CsrfService, 
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
    // Zone.md'ye göre: Güvenli logout işlemi
    try {
      const result = await this.authService.logout(userId, sessionId);
      
      // CSRF token'ı da iptal et
      const csrfToken = req.cookies?.csrf_token;
      if (csrfToken) {
        this.csrf.revokeToken(csrfToken);
      }
      
      this.clearAuthCookies(req);
      return result;
    } catch (error) {
      // Hata durumunda da cookie'leri temizle
      this.clearAuthCookies(req);
      throw error;
    }
  }

  private cookieBaseOptions(maxAgeMs?: number) {
    // Zone.md'ye göre: Güvenli cookie ayarları
    const isProduction = process.env.NODE_ENV === 'production';
    const crossSite = process.env.CROSS_SITE_COOKIES === 'true';
    
    // Cross-site durumunda SameSite=None ve Secure=true zorunlu
    // Aynı site durumunda SameSite=Strict daha güvenli
    const sameSite = crossSite ? 'None' : 'Strict';
    const secure = isProduction || crossSite;

    return {
      httpOnly: true, // XSS koruması
      secure: secure, // HTTPS zorunluluğu
      sameSite: sameSite as any, // CSRF koruması
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
      ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
    };
  }

  private setAccessCookie(req: any, token: string) {
    // Zone.md'ye göre: Kısa ömürlü access token (5-15 dakika)
    const raw = process.env.ACCESS_TOKEN_TTL || '900s'; // varsayılan 15 dakika
    const accessMs = this.parseDurationToMs(raw, 900_000); // default 15m
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
      // Tüm auth-related cookie'leri temizle
      req.res.cookie('access_token', '', { ...base, maxAge: 0 });
      req.res.cookie('refresh_token', '', { ...base, maxAge: 0 });
      req.res.cookie('csrf_token', '', { ...base, maxAge: 0 });
    } catch (e) { 
      // Cookie temizleme hatası loglanabilir ama işlemi durdurmaz
      console.warn('Cookie temizleme hatası:', e.message);
    }
  }

  @Get('csrf')
  getCsrf(@Req() req: any) {
    const token = this.csrf.generateToken();
    const crossSite = process.env.CROSS_SITE_COOKIES === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite = crossSite ? 'None' : 'Strict';
    
    // Zone.md'ye göre: CSRF token hem cookie hem response'da gönderilmeli
    req.res.cookie('csrf_token', token, {
      httpOnly: false, // Frontend'in erişebilmesi için HttpOnly=false
      secure: isProduction || crossSite,
      sameSite: sameSite as any,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 60 * 60 * 1000, // 1 saat
    });
    
    // Token'ı response'da da gönder (double submit cookie pattern)
    return { 
      success: true, 
      csrfToken: token // Frontend bu token'ı header'da gönderecek
    };
  }
}
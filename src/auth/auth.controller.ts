// src/auth/auth.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RecoveryDto } from './dto/recovery.dto';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { ErrorResponseDto } from '../common/dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

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
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
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
  @UseGuards(RateLimitGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.authService.login(loginDto, req.ip);
  }

  @ApiOperation({ summary: 'User login with recovery code' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully.',
    type: ProfileResponseDto
  }) @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(RateLimitGuard)
  @Post('login-recovery')
  async loginWithRecoveryCode(@Body() recoveryDto: RecoveryDto, @Req() req: any) {
    return this.authService.loginWithRecoveryCode(recoveryDto, req.ip);
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Req() req: any): ProfileResponseDto {
    return req.user;
  }
}
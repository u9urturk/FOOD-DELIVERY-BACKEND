import { Controller, Get, Put, Body, UseGuards, Delete, Param, Query } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivityLogService } from './activity/activity-log.service';
import { SessionService } from './session/session.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { parseUserAgent } from 'src/common/utils/ua.util';
import { ErrorResponseDto } from 'src/common/dto/response.dto';

class SessionDeviceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() expiresAt!: Date;
  @ApiProperty({ required: false }) ip?: string;
  @ApiProperty({ required: false }) userAgent?: string;
  @ApiProperty({ required: false }) browser?: string;
  @ApiProperty({ required: false }) os?: string;
  @ApiProperty({ required: false }) device?: string;
  @ApiProperty() isCurrent!: boolean;
  @ApiProperty({ enum: ['active', 'revoked', 'expired'] }) status!: 'active' | 'revoked' | 'expired';
  @ApiProperty({ required: false }) revokedAt?: Date;
  @ApiProperty({ required: false }) revokedReason?: string;
}

class ActivityEntryDto { id!: string; action!: string; createdAt!: Date; metadata?: any; }

@UseGuards(JwtAuthGuard)
@ApiTags('Profile')
@Controller('profile')
@ApiBearerAuth()  
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
  private readonly activityLog: ActivityLogService,
  private readonly sessionService: SessionService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  getMe(@GetUser('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }
  
  @Get('users-with-roles')
  @ApiOperation({ summary: 'List all users with their roles' })
  @ApiResponse({ status: 200, description: 'User list with roles.' })
  listUsersWithRoles() {
    return this.profileService.listUsersWithRoles();
  }

  @Put('me')
  @ApiOperation({ summary: 'Update profile (email, avatar)' })
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
  updateProfile(@GetUser('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Put('me/preferences')
  @ApiOperation({ summary: 'Update preference fields' })
  @ApiResponse({ status: 200, description: 'Preferences updated.' })
  updatePreferences(@GetUser('userId') userId: string, @Body() dto: UpdatePreferencesDto) {
    return this.profileService.updatePreferences(userId, dto);
  }

  @Put('me/password')
  @ApiOperation({ summary: 'Change password (rotates other sessions)' })
  @ApiResponse({ status: 200, description: 'Password changed.' })
  @ApiResponse({ status: 400, description: 'Validation / policy error', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  changePassword(@GetUser('userId') userId: string, @GetUser('sessionId') sessionId: string, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(userId, dto, sessionId);
  }

  @Get('me/activity')
  @ApiOperation({ summary: 'List recent activity entries' })
  @ApiResponse({ status: 200, description: 'Activity list.', type: [ActivityEntryDto] })
  listActivity(@GetUser('userId') userId: string) {
    return this.activityLog.list(userId);
  }

  @Get('me/sessions')
  @ApiOperation({ summary: 'List active sessions (cihaz bilgisi ile)' })
  @ApiResponse({ status: 200, description: 'Sessions list.', type: [SessionDeviceResponseDto] })
  listSessions(@GetUser('userId') userId: string, @GetUser('sessionId') currentSessionId: string) {
    return this.sessionService.list(userId).then(list => list.map(s => {
  const parsed = parseUserAgent(s.userAgent || '');
      const status: 'active' | 'revoked' | 'expired' = s.revokedAt ? 'revoked' : (s.expiresAt < new Date() ? 'expired' : 'active');
      return {
        ...s,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
        isCurrent: s.id === currentSessionId,
        status,
      } as SessionDeviceResponseDto;
    }));
  }

  // UA parsing helper externalized to keep controller slim

  @Delete('me/sessions/:id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session revoked.' })
  @ApiResponse({ status: 404, description: 'Session not found', type: ErrorResponseDto })
  revokeSession(@GetUser('userId') userId: string, @Param('id') id: string) {
    return this.sessionService.revoke(userId, id);
  }

  @Delete('me/sessions')
  @ApiOperation({ summary: 'Bulk revoke all sessions (optionally keep current)' })
  @ApiQuery({ name: 'keepCurrent', required: false, description: 'true ise mevcut oturum korunur' })
  @ApiResponse({ status: 200, description: 'Sessions revoked.' })
  bulkRevoke(@GetUser('userId') userId: string, @GetUser('sessionId') sessionId: string, @Query('keepCurrent') keepCurrent?: string) {
    const keep = keepCurrent === 'true';
    return this.sessionService.revokeAll(userId, keep ? sessionId : undefined);
  }
}

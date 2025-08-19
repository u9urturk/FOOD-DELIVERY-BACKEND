import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { MfaService } from './mfa.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

class MfaTokenDto { token!: string; }

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('MFA')
@Controller('profile/mfa')
export class MfaController {
  constructor(private readonly mfa: MfaService) {}

  @Post('enable')
  @ApiOperation({ summary: 'Generate QR to enable MFA' })
  @ApiResponse({ status: 201, description: 'QR code generated.' })
  enable(@GetUser('userId') userId: string) {
    return this.mfa.enable(userId);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify MFA token to activate' })
  @ApiResponse({ status: 200, description: 'MFA verified.' })
  verify(@GetUser('userId') userId: string, @Body() dto: MfaTokenDto) {
    return this.mfa.verify(userId, dto.token);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable MFA (requires valid token)' })
  @ApiResponse({ status: 200, description: 'MFA disabled.' })
  disable(@GetUser('userId') userId: string, @Body() dto: MfaTokenDto) {
    return this.mfa.disable(userId, dto.token);
  }
}

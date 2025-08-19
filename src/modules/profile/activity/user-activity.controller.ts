import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';

@ApiTags('User Activity')
@Controller('user-activity')
export class UserActivityController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Kullanıcının aktivitelerini listeler' })
  @ApiParam({ name: 'userId', type: String, description: 'Kullanıcı ID' })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Sayfalama için cursor' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Kaç kayıt dönecek (varsayılan: 20)' })
  @ApiResponse({ status: 200, description: 'Aktivite listesi başarıyla döndü.' })
  async listUserActivities(
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.activityLogService.list(userId, cursor, limit ?? 20);
  }
}

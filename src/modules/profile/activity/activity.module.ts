import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { UserActivityController } from './user-activity.controller';

@Module({
  providers: [ActivityLogService],
  controllers: [UserActivityController],
  exports: [ActivityLogService],
})
export class ActivityModule {}

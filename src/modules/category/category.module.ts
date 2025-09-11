import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { ErrorService } from 'src/common/services/error.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoryController],
  providers: [CategoryService, ErrorService],
  exports: [CategoryService],
})
export class CategoryModule {}

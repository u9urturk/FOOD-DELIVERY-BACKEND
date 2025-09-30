import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { ErrorService } from 'src/common/services/error.service';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductController],
  providers: [ProductService, ErrorService],
  exports: [ProductService],
})
export class ProductModule {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateStockTypeDto } from './create-stock-type.dto';

export class UpdateStockTypeDto extends PartialType(CreateStockTypeDto) {}

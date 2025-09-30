import { PartialType } from '@nestjs/mapped-types';
import { CreateBaseUnitDto } from './create-base-unit.dto';

export class UpdateBaseUnitDto extends PartialType(CreateBaseUnitDto) {}

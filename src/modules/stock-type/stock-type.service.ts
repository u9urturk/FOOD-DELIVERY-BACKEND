import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateStockTypeDto } from './dto/create-stock-type.dto';
import { UpdateStockTypeDto } from './dto/update-stock-type.dto';

@Injectable()
export class StockTypeService {
  constructor(private prisma: DatabaseService, private errorService: ErrorService) {}

  async findAll() {
    try {
      return await this.prisma.stockType.findMany({ include: { products: true } });
    } catch (e) {
      this.errorService.handleError(e, 'liste stock types');
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.prisma.stockType.findUnique({ where: { id }, include: { products: true } });
      if (!item) this.errorService.throwNotFound('StockType');
      return item;
    } catch (e) {
      this.errorService.handleError(e, 'get stock type');
    }
  }

  async create(dto: CreateStockTypeDto) {
    try {
      return await this.prisma.stockType.create({ data: dto });
    } catch (e) {
      this.errorService.handleError(e, 'create stock type');
    }
  }

  async update(id: string, dto: UpdateStockTypeDto) {
    try {
      return await this.prisma.stockType.update({ where: { id }, data: dto });
    } catch (e) {
      this.errorService.handleError(e, 'update stock type');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.stockType.delete({ where: { id } });
      return { message: 'deleted' };
    } catch (e) {
      this.errorService.handleError(e, 'delete stock type');
    }
  }
}

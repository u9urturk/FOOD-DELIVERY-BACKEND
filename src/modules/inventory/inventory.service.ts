import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';


@Injectable()
export class InventoryService {
  constructor(private prisma: DatabaseService, private errorService: ErrorService) {}

  async findAll() {
    try {
      return await this.prisma.inventory.findMany({ include: { product: true, warehouse: true, supplier: true } });
    } catch (e) {
      this.errorService.handleError(e, 'liste inventory');
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.prisma.inventory.findUnique({ where: { id }, include: { product: true, warehouse: true, supplier: true } });
      if (!item) this.errorService.throwNotFound('Inventory');
      return item;
    } catch (e) {
      this.errorService.handleError(e, 'get inventory');
    }
  }

  async create(dto: CreateInventoryDto) {
    try {
      // Prisma Decimal fields accept number or string depending on setup
      return await this.prisma.inventory.create({ data: dto });
    } catch (e) {
      this.errorService.handleError(e, 'create inventory');
    }
  }

  async update(id: string, dto: UpdateInventoryDto) {
    try {
      return await this.prisma.inventory.update({ where: { id }, data: dto });
    } catch (e) {
      this.errorService.handleError(e, 'update inventory');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.inventory.delete({ where: { id } });
      return { message: 'deleted' };
    } catch (e) {
      this.errorService.handleError(e, 'delete inventory');
    }
  }
}

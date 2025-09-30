import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: DatabaseService, private errorService: ErrorService) {}

  async findAll() {
    try {
      return await this.prisma.category.findMany({ include: { products: true } });
    } catch (e) {
      this.errorService.handleError(e, 'liste categories');
    }
  }

  async findOne(id: string) {
    try {
      const item = await this.prisma.category.findUnique({ where: { id }, include: { products: true } });
      if (!item) this.errorService.throwNotFound('Category');
      return item;
    } catch (e) {
      this.errorService.handleError(e, 'get category');
    }
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (e) {
      this.errorService.handleError(e, 'create category');
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (e) {
      this.errorService.handleError(e, 'update category');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.category.delete({ where: { id } });
      return { message: 'deleted' };
    } catch (e) {
      this.errorService.handleError(e, 'delete category');
    }
  }
}

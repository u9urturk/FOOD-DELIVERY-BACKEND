import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';


@Injectable()
export class ProductService {
  constructor(private prisma: DatabaseService, private errorService: ErrorService) {}

  async findAll() {
    try {
      return await this.prisma.product.findMany({
        include: { category: true, stockType: true, baseUnit: true },
      });
    } catch (e) {
      this.errorService.handleError(e, 'liste ürünler');
    }
  }

  async findOne(id: string) {
    try {
      const p = await this.prisma.product.findUnique({ where: { id } , include: { category: true, stockType: true, baseUnit: true } });
      if (!p) this.errorService.throwNotFound('Product');
      return p;
    } catch (e) {
      this.errorService.handleError(e, 'get product');
    }
  }

  async create(dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({ data: dto });
      return product;
    } catch (e) {
      this.errorService.handleError(e, 'create product');
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.update({ where: { id }, data: dto });
      return product;
    } catch (e) {
      this.errorService.handleError(e, 'update product');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
      return { message: 'deleted' };
    } catch (e) {
      this.errorService.handleError(e, 'delete product');
    }
  }
}

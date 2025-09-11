import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateBaseUnitDto } from './dto/create-base-unit.dto';
import { UpdateBaseUnitDto } from './dto/update-base-unit.dto';

@Injectable()
export class BaseUnitService {
    constructor(private prisma: DatabaseService, private errorService: ErrorService) { }

    async findAll() {
        try {
            return await this.prisma.baseUnit.findMany({ include: { products: true } });
        } catch (e) {
            this.errorService.handleError(e, 'liste base units');
        }
    }

    async findOne(id: string) {
        try {
            const item = await this.prisma.baseUnit.findUnique({ where: { id }, include: { products: true } });
            if (!item) this.errorService.throwNotFound('BaseUnit');
            return item;
        } catch (e) {
            this.errorService.handleError(e, 'get base unit');
        }
    }

    async create(dto: CreateBaseUnitDto) {
        try {
            return await this.prisma.baseUnit.create({ data: dto });
        } catch (e) {
            this.errorService.handleError(e, 'create base unit');
        }
    }

    async update(id: string, dto: UpdateBaseUnitDto) {
        try {
            return await this.prisma.baseUnit.update({ where: { id }, data: dto });
        } catch (e) {
            this.errorService.handleError(e, 'update base unit');
        }
    }

    async remove(id: string) {
        try {
            await this.prisma.baseUnit.delete({ where: { id } });
            return { message: 'deleted' };
        } catch (e) {
            this.errorService.handleError(e, 'delete base unit');
        }
    }
}



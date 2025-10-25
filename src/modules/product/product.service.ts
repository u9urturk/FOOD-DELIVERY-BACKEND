import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ErrorService } from 'src/common/services/error.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from '@prisma/client';


@Injectable()
export class ProductService {
  constructor(private prisma: DatabaseService, private errorService: ErrorService) {}

  /**
   * Türkçe karakterleri İngilizce karşılıklarına çevirir
   */
  private convertTurkishChars(text: string): string {
    const turkishChars: { [key: string]: string } = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G',
      'ı': 'i', 'I': 'I',
      'İ': 'I', 'i': 'i',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };

    return text.replace(/[çÇğĞıIİiöÖşŞüÜ]/g, (match) => turkishChars[match] || match);
  }

  /**
   * Verilen pattern için bir sonraki sıra numarasını bulur
   */
  private async getNextSequenceNumber(pattern: string): Promise<string> {
    try {
      const existingProducts = await this.prisma.product.findMany({
        where: {
          sku: {
            startsWith: pattern
          }
        },
        select: { sku: true }
      });

      if (existingProducts.length === 0) {
        return '001';
      }

      // Mevcut SKU'lardan numaraları çıkar ve en büyüğünü bul
      const numbers = existingProducts
        .map(p => p.sku?.split('-').pop())
        .filter(num => num && /^\d{3}$/.test(num))
        .map(num => parseInt(num!, 10))
        .filter(num => !isNaN(num));

      const maxNumber = Math.max(...numbers);
      const nextNumber = maxNumber + 1;
      
      return nextNumber.toString().padStart(3, '0');
    } catch (error) {
      return '001';
    }
  }

  /**
   * Ürün adı ve kategori ID'sinden unique SKU oluşturur
   * Format: [PRODUCT_3CHAR]-[CATEGORY_2CHAR]-[NUMBER]
   */
  private async generateUniqueSku(productName: string, categoryId: string): Promise<string> {
    try {
      // Kategori bilgisini çek ve validate et
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Geçersiz kategori ID');
      }

      const category = await this.prisma.category.findUnique({
        where: { id: categoryId.trim() }, // Trim whitespace
        select: { name: true, id: true }
      });

      if (!category) {
        // Alternatif olarak tüm kategorileri kontrol et
        const categoryCount = await this.prisma.category.count();
        throw new Error(`Kategori bulunamadı - ID: ${categoryId} (Total categories: ${categoryCount})`);
      }

      // Ürün adından ilk 3 karakteri al ve temizle
      const cleanProductName = this.convertTurkishChars(productName)
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .substring(0, 3)
        .padEnd(3, 'X'); // 3 karakterden kısa ise X ile doldur

      // Kategori adından ilk 2 karakteri al ve temizle
      const cleanCategoryName = this.convertTurkishChars(category.name)
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .substring(0, 2)
        .padEnd(2, 'X'); // 2 karakterden kısa ise X ile doldur

      // Pattern oluştur (numara hariç)
      const pattern = `${cleanProductName}-${cleanCategoryName}-`;
      
      // Sıra numarasını al
      const sequenceNumber = await this.getNextSequenceNumber(pattern);
      
      // Final SKU'yu oluştur
      const sku = `${pattern}${sequenceNumber}`;
      
      return sku;
    } catch (error) {
      this.errorService.handleError(error, 'SKU oluşturma');
      throw error;
    }
  }

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
      // SKU oluştur
      const sku = await this.generateUniqueSku(dto.name, dto.categoryId);
      
      // SKU ile birlikte ürünü oluştur
      const product = await this.prisma.product.create({ 
        data: {
          ...dto,
          sku
        },
        include: { 
          category: true, 
          stockType: true, 
          baseUnit: true 
        }
      });
      
      return product;
    } catch (e) {
      this.errorService.handleError(e, 'create product');
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.update({ 
        where: { id }, 
        data: {
          ...dto
        },
        include: { 
          category: true, 
          stockType: true, 
          baseUnit: true 
        }
      });
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

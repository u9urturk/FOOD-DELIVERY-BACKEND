import { Injectable, Logger } from '@nestjs/common';
import { 
  BusinessException, 
  AuthenticationException, 
  AuthorizationException,
  NotFoundException,
  ConflictException,
  RateLimitException,
  DatabaseException,
  ExternalServiceException
} from '../exceptions/custom.exceptions';

@Injectable()
export class ErrorService {
  private readonly logger = new Logger(ErrorService.name);

  // Authentication errors
  throwInvalidCredentials(): never {
    throw new AuthenticationException('Kullanıcı adı veya şifre hatalı');
  }

  throwInvalidToken(): never {
    throw new AuthenticationException('Geçersiz token');
  }

  throwTokenExpired(): never {
    throw new AuthenticationException('Token süresi dolmuş');
  }

  throwInvalidOTP(): never {
    throw new AuthenticationException('Geçersiz doğrulama kodu');
  }

  throwUserNotFound(): never {
    throw new NotFoundException('Kullanıcı bulunamadı');
  }

  throwUsernameConflict(): never {
    throw new ConflictException('Bu kullanıcı adı zaten kullanımda');
  }

  // Authorization errors
  throwInsufficientPermissions(): never {
    throw new AuthorizationException('Bu işlem için yetkiniz bulunmuyor');
  }

  throwRoleRequired(role: string): never {
    throw new AuthorizationException(`Bu işlem için ${role} yetkisi gereklidir`);
  }

  // Rate limiting
  throwRateLimitExceeded(remainingTime: number): never {
    throw new RateLimitException(
      `Çok fazla istek gönderildi. ${remainingTime} saniye sonra tekrar deneyin`
    );
  }

  // Business logic errors
  throwBusinessError(message: string): never {
    throw new BusinessException(message);
  }

  throwNotFound(resource: string): never {
    throw new NotFoundException(`${resource} bulunamadı`);
  }

  throwConflict(message: string): never {
    throw new ConflictException(message);
  }

  // Database errors
  throwDatabaseError(operation: string): never {
    this.logger.error(`Database error during ${operation}`);
    throw new DatabaseException(`${operation} sırasında veritabanı hatası oluştu`);
  }

  // External service errors
  throwRedisError(): never {
    throw new ExternalServiceException('Redis', 'Cache servisi kullanılamıyor');
  }

  throwEmailServiceError(): never {
    throw new ExternalServiceException('Email Service', 'E-posta servisi kullanılamıyor');
  }

  throwPaymentServiceError(): never {
    throw new ExternalServiceException('Payment Service', 'Ödeme servisi kullanılamıyor');
  }

  // Menu specific errors
  throwMenuItemNotFound(): never {
    throw new NotFoundException('Menü öğesi');
  }

  throwMenuCategoryNotFound(): never {
    throw new NotFoundException('Menü kategorisi');
  }

  throwMenuItemUnavailable(): never {
    throw new BusinessException('Bu menü öğesi şu anda mevcut değil');
  }

  // Order specific errors
  throwOrderNotFound(): never {
    throw new NotFoundException('Sipariş bulunamadı');
  }

  throwOrderCannotBeCancelled(): never {
    throw new BusinessException('Bu sipariş iptal edilemez');
  }

  throwInsufficientStock(itemName: string): never {
    throw new BusinessException(`${itemName} için yeterli stok bulunmuyor`);
  }

  // Table specific errors
  throwTableNotFound(): never {
    throw new NotFoundException('Masa bulunamadı');
  }

  throwTableNotAvailable(): never {
    throw new BusinessException('Bu masa şu anda mevcut değil');
  }

  throwTableAlreadyOccupied(): never {
    throw new ConflictException('Bu masa zaten dolu');
  }

  // Stock specific errors
  throwStockItemNotFound(): never {
    throw new NotFoundException('Stok öğesi bulunamadı');
  }

  throwInvalidStockQuantity(): never {
    throw new BusinessException('Geçersiz stok miktarı');
  }

  throwStockMovementError(): never {
    throw new BusinessException('Stok hareketi işleminde hata oluştu');
  }

  // File upload errors
  throwInvalidFileType(): never {
    throw new BusinessException('Geçersiz dosya türü');
  }

  throwFileSizeExceeded(): never {
    throw new BusinessException('Dosya boyutu sınırı aşıldı');
  }

  throwFileUploadError(): never {
    throw new BusinessException('Dosya yüklenirken hata oluştu');
  }

  // Validation helper
  throwValidationError(field: string, message: string): never {
    throw new BusinessException(`${field}: ${message}`);
  }

  // Generic error handler for catch blocks
  handleError(error: any, operation: string): never {
    if (error instanceof Error) {
      this.logger.error(`Error in ${operation}: ${error.message}`, error.stack);
    } else {
      this.logger.error(`Unknown error in ${operation}: ${error}`);
    }
    
    // Re-throw if it's already a custom exception
    if (error instanceof BusinessException || 
        error instanceof AuthenticationException ||
        error instanceof AuthorizationException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof RateLimitException ||
        error instanceof DatabaseException ||
        error instanceof ExternalServiceException) {
      throw error;
    }
    
    // Otherwise throw a generic business error
    throw new BusinessException(`${operation} sırasında bir hata oluştu`);
  }

  // Log and return error for non-critical operations
  logAndContinue(error: any, operation: string): void {
    if (error instanceof Error) {
      this.logger.warn(`Non-critical error in ${operation}: ${error.message}`);
    } else {
      this.logger.warn(`Non-critical unknown error in ${operation}: ${error}`);
    }
  }
}

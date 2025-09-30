import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
  }
}

export class AuthenticationException extends HttpException {
  constructor(message: string = 'Kimlik doğrulama başarısız') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class AuthorizationException extends HttpException {
  constructor(message: string = 'Bu işlem için yetkiniz bulunmuyor') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ValidationException extends HttpException {
  constructor(message: string = 'Doğrulama hatası') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class NotFoundException extends HttpException {
  constructor(resource: string = 'Kayıt') {
    super(`${resource} bulunamadı`, HttpStatus.NOT_FOUND);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = 'Çakışma hatası') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class RateLimitException extends HttpException {
  constructor(message: string = 'Çok fazla istek gönderildi') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class DatabaseException extends HttpException {
  constructor(message: string = 'Veritabanı hatası oluştu') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ExternalServiceException extends HttpException {
  constructor(service: string, message: string = 'Dış servis kullanılamıyor') {
    super(`${service}: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

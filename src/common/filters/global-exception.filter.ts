import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.getHttpResponse(exception);

    // Log the error
    this.logError(exception, request);

    // Send standardized error response
    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      error: error,
      message: message,
      requestId: this.generateRequestId(),
    });
  }

  private getHttpResponse(exception: unknown): {
    status: number;
    message: string;
    error: string;
  } {
    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'string') {
        return {
          status,
          message: response,
          error: this.getErrorType(status),
        };
      }
      
      const errorResponse = response as any;
      return {
        status,
        message: Array.isArray(errorResponse.message) 
          ? errorResponse.message.join(', ')
          : errorResponse.message || exception.message,
        error: errorResponse.error || this.getErrorType(status),
      };
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Veritabanı doğrulama hatası oluştu',
        error: 'Database Validation Error',
      };
    }

    // Handle JWT errors
    if (exception instanceof Error) {
      if (exception.name === 'TokenExpiredError') {
        return {
          status: HttpStatus.UNAUTHORIZED,
          message: 'Token süresi dolmuş',
          error: 'Token Expired',
        };
      }

      if (exception.name === 'JsonWebTokenError') {
        return {
          status: HttpStatus.UNAUTHORIZED,
          message: 'Geçersiz token',
          error: 'Invalid Token',
        };
      }

      if (exception.name === 'NotBeforeError') {
        return {
          status: HttpStatus.UNAUTHORIZED,
          message: 'Token henüz aktif değil',
          error: 'Token Not Active',
        };
      }
    }

    // Handle Redis errors
    if (exception instanceof Error && exception.message.includes('Redis')) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Cache servisi şu anda kullanılamıyor',
        error: 'Cache Service Unavailable',
      };
    }

    // Handle custom application errors
    if (exception instanceof Error) {
      const customError = this.handleCustomErrors(exception);
      if (customError) {
        return customError;
      }
    }

    // Default error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Beklenmeyen bir hata oluştu',
      error: 'Internal Server Error',
    };
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } {
    switch (exception.code) {
      case 'P2000':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Girilen değer çok uzun',
          error: 'Value Too Long',
        };

      case 'P2001':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Aranan kayıt bulunamadı',
          error: 'Record Not Found',
        };

      case 'P2002':
        const target = exception.meta?.target as string[];
        const field = target ? target[0] : 'alan';
        return {
          status: HttpStatus.CONFLICT,
          message: `Bu ${field} zaten kullanımda`,
          error: 'Unique Constraint Violation',
        };

      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'İlişkili kayıt bulunamadı',
          error: 'Foreign Key Constraint Failed',
        };

      case 'P2004':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Veritabanı kısıtlaması ihlal edildi',
          error: 'Constraint Failed',
        };

      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Güncellenecek veya silinecek kayıt bulunamadı',
          error: 'Record Not Found',
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Veritabanı hatası oluştu',
          error: 'Database Error',
        };
    }
  }

  private handleCustomErrors(exception: Error): {
    status: number;
    message: string;
    error: string;
  } | null {
    // Auth related errors
    if (exception.message.includes('Username already taken')) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Bu kullanıcı adı zaten kullanımda',
        error: 'Username Conflict',
      };
    }

    if (exception.message.includes('User not found')) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Kullanıcı bulunamadı',
        error: 'User Not Found',
      };
    }

    if (exception.message.includes('Invalid OTP') || exception.message.includes('Invalid recovery code')) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Geçersiz doğrulama kodu',
        error: 'Invalid Verification Code',
      };
    }

    if (exception.message.includes('Too many attempts')) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: exception.message,
        error: 'Rate Limit Exceeded',
      };
    }

    // Role/Permission errors
    if (exception.message.includes('Insufficient permissions')) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Bu işlem için yetkiniz bulunmuyor',
        error: 'Insufficient Permissions',
      };
    }

    return null;
  }

  private getErrorType(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      default:
        return 'Unknown Error';
    }
  }

  private logError(exception: unknown, request: Request): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      
      if (status >= 500) {
        this.logger.error(
          `HTTP ${status} Error: ${exception.message}`,
          exception.stack,
          `${method} ${url} - ${ip} - ${userAgent}`,
        );
      } else {
        this.logger.warn(
          `HTTP ${status} Warning: ${exception.message}`,
          `${method} ${url} - ${ip} - ${userAgent}`,
        );
      }
    } else {
      this.logger.error(
        `Unexpected Error: ${exception}`,
        exception instanceof Error ? exception.stack : 'No stack trace available',
        `${method} ${url} - ${ip} - ${userAgent}`,
      );
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

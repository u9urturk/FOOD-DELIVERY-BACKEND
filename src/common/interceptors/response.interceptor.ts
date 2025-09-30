import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponseDto } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // Eğer data zaten bir response formatında ise (success field'ı varsa), olduğu gibi döndür
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Aksi halde standardize et
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

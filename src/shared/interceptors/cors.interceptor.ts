import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { CORS_METADATA_KEY } from '../decorators/cors.decorator';

/**
 * Interceptor to handle custom CORS headers for specific routes
 */
@Injectable()
export class CorsInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const customOrigins = this.reflector.get<string[]>(
            CORS_METADATA_KEY,
            context.getHandler(),
        );

        if (customOrigins) {
            const response = context.switchToHttp().getResponse<Response>();
            const request = context.switchToHttp().getRequest();
            
            const origin = request.headers.origin;
            
            if (customOrigins.includes(origin) || customOrigins.includes('*')) {
                response.header('Access-Control-Allow-Origin', origin || '*');
                response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
                response.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
                response.header('Access-Control-Allow-Credentials', 'true');
            }
        }

        return next.handle();
    }
}

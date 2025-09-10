// src/shared/filters/http-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../../application/dtos/common/error-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Đã xảy ra lỗi không mong muốn';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse['message']) {
                message = Array.isArray(exceptionResponse['message']) 
                    ? exceptionResponse['message'].join(', ')
                    : exceptionResponse['message'];
            }
        } else if (exception instanceof Error) {
            // Xử lý các lỗi không phải HttpException
            message = exception.message || 'Đã xảy ra lỗi không mong muốn';
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
        }

        // Log lỗi nếu là server error
        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `${request.method} ${request.url} - Status: ${status}`,
                exception instanceof Error ? exception.stack : exception,
            );
        } else if (status >= HttpStatus.BAD_REQUEST) {
            // Log warning cho client errors
            this.logger.warn(
                `${request.method} ${request.url} - Status: ${status} - Message: ${message}`
            );
        }

        const errorResponse = new ErrorResponseDto(
            message,
            status,
            request.url,
        );

        response.status(status).json(errorResponse);
    }
}

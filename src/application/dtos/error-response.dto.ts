// src/application/dtos/error-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({ description: 'Trạng thái thành công', example: false })
    success: boolean;

    @ApiProperty({ description: 'Thông báo lỗi', example: 'Username đã tồn tại' })
    message: string;

    @ApiProperty({ description: 'Mã lỗi HTTP', example: 409 })
    statusCode: number;

    @ApiProperty({ description: 'Timestamp lỗi', example: '2025-08-27T10:30:00.000Z' })
    timestamp: string;

    @ApiProperty({ description: 'Đường dẫn API', example: '/auth/register/admin' })
    path: string;

    constructor(message: string, statusCode: number, path: string) {
        this.success = false;
        this.message = message;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
        this.path = path;
    }
}

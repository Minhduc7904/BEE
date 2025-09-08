// src/application/dtos/base-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<TData = any> {
    @ApiProperty({ description: 'Trạng thái thành công', example: true })
    success: boolean;

    @ApiProperty({ description: 'Thông báo kết quả', example: 'Thao tác thành công' })
    message: string;

    data?: TData;

    constructor(success: boolean, message: string, data?: TData) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static success<T>(message: string, data?: T): BaseResponseDto<T> {
        return new BaseResponseDto(true, message, data);
    }

    static error<T>(message: string): BaseResponseDto<T> {
        return new BaseResponseDto(false, message, undefined) as BaseResponseDto<T>;
    }
}

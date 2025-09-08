// src/application/dtos/pagination-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
    @ApiProperty({ description: 'Trang hiện tại', example: 1 })
    page: number;

    @ApiProperty({ description: 'Số bản ghi trên mỗi trang', example: 10 })
    limit: number;

    @ApiProperty({ description: 'Tổng số bản ghi', example: 100 })
    total: number;

    @ApiProperty({ description: 'Tổng số trang', example: 10 })
    totalPages: number;

    @ApiProperty({ description: 'Có trang trước không', example: false })
    hasPrevious: boolean;

    @ApiProperty({ description: 'Có trang sau không', example: true })
    hasNext: boolean;

    @ApiProperty({ description: 'Trang trước (nếu có)', example: null, required: false })
    previousPage?: number;

    @ApiProperty({ description: 'Trang sau (nếu có)', example: 2, required: false })
    nextPage?: number;

    constructor(page: number, limit: number, total: number) {
        this.page = page;
        this.limit = limit;
        this.total = total;
        this.totalPages = Math.ceil(total / limit);
        this.hasPrevious = page > 1;
        this.hasNext = page < this.totalPages;
        this.previousPage = this.hasPrevious ? page - 1 : undefined;
        this.nextPage = this.hasNext ? page + 1 : undefined;
    }
}

export class PaginationResponseDto<TData = any> {
    @ApiProperty({ description: 'Trạng thái thành công', example: true })
    success: boolean;

    @ApiProperty({ description: 'Thông báo kết quả', example: 'Lấy dữ liệu thành công' })
    message: string;

    @ApiProperty({ description: 'Danh sách dữ liệu', type: 'array' })
    data: TData[];

    @ApiProperty({ description: 'Thông tin phân trang', type: PaginationMetaDto })
    meta: PaginationMetaDto;

    constructor(
        success: boolean,
        message: string,
        data: TData[],
        meta: PaginationMetaDto
    ) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.meta = meta;
    }

    static success<T>(
        message: string,
        data: T[],
        page: number,
        limit: number,
        total: number
    ): PaginationResponseDto<T> {
        const meta = new PaginationMetaDto(page, limit, total);
        return new PaginationResponseDto(true, message, data, meta);
    }

    static error<T>(
        message: string,
        page: number = 1,
        limit: number = 10
    ): PaginationResponseDto<T> {
        const meta = new PaginationMetaDto(page, limit, 0);
        return new PaginationResponseDto(false, message, [], meta);
    }
}

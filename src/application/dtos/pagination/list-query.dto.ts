// src/application/dtos/list-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min, Max, IsString, MaxLength, IsIn, IsDateString } from 'class-validator';
import { Trim } from 'src/shared/decorators/trim.decorator';
/**
 * DTO flat cho các query list có pagination, sort và filter
 */
export class ListQueryDto {
    // Pagination properties
    @ApiPropertyOptional({
        description: 'Số trang (bắt đầu từ 1)',
        example: 1,
        minimum: 1,
        default: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive({ message: 'Số trang phải là số nguyên dương' })
    @Min(1, { message: 'Số trang phải bắt đầu từ 1' })
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số bản ghi trên mỗi trang',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsPositive({ message: 'Kích thước trang phải là số nguyên dương' })
    @Min(1, { message: 'Kích thước trang tối thiểu là 1' })
    @Max(100, { message: 'Kích thước trang tối đa là 100' })
    limit?: number = 10;

    // Search property
    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm',
        example: 'admin',
        maxLength: 255
    })
    @IsOptional()
    @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
    @Trim()
    @MaxLength(255, { message: 'Từ khóa tìm kiếm không được vượt quá 255 ký tự' })
    search?: string;

    // Sort properties
    @ApiPropertyOptional({
        description: 'Trường để sắp xếp',
        example: 'createdAt'
    })
    @IsOptional()
    @IsString({ message: 'Trường sắp xếp phải là chuỗi' })
    @Trim()
    @MaxLength(50, { message: 'Tên trường sắp xếp không được vượt quá 50 ký tự' })
    sortBy?: string;

    @ApiPropertyOptional({
        description: 'Thứ tự sắp xếp',
        example: 'desc',
        enum: ['asc', 'desc'],
        default: 'desc'
    })
    @IsOptional()
    @IsString({ message: 'Thứ tự sắp xếp phải là chuỗi' })
    @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp phải là "asc" hoặc "desc"' })
    sortOrder?: 'asc' | 'desc' = 'desc';

    // Filter properties
    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái',
        example: 'active'
    })
    @IsOptional()
    @IsString({ message: 'Trạng thái phải là chuỗi' })
    @Trim()
    status?: string;

    @ApiPropertyOptional({
        description: 'Lọc từ ngày (ISO 8601)',
        example: '2024-01-01T00:00:00.000Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'Từ ngày phải có định dạng ISO 8601' })
    fromDate?: string;

    @ApiPropertyOptional({
        description: 'Lọc đến ngày (ISO 8601)',
        example: '2024-12-31T23:59:59.999Z'
    })
    @IsOptional()
    @IsDateString({}, { message: 'Đến ngày phải có định dạng ISO 8601' })
    toDate?: string;

    /**
     * Tính toán offset cho database query
     */
    get offset(): number {
        return ((this.page || 1) - 1) * (this.limit || 10);
    }

    /**
     * Chuẩn hóa tất cả dữ liệu
     */
    normalize(): void {
        this.page = Math.max(1, this.page || 1);
        this.limit = Math.min(100, Math.max(1, this.limit || 10));
        this.sortOrder = this.sortOrder === 'asc' ? 'asc' : 'desc';

        // Trim search string
        if (this.search) {
            this.search = this.search.trim();
            if (this.search.length === 0) {
                this.search = undefined;
            }
        }

        // Trim status
        if (this.status) {
            this.status = this.status.trim().toLowerCase();
            if (this.status.length === 0) {
                this.status = undefined;
            }
        }
    }

    /**
     * Validate sort field có hợp lệ không
     */
    validateSortField(allowedFields: string[]): boolean {
        if (!this.sortBy) {
            return true; // Optional field
        }

        return allowedFields.includes(this.sortBy);
    }

    /**
     * Validate date range
     */
    validateDateRange(): boolean {
        if (!this.fromDate || !this.toDate) {
            return true; // Valid if one or both are missing
        }

        const from = new Date(this.fromDate);
        const to = new Date(this.toDate);

        return from <= to;
    }

    /**
     * Tạo object sort cho Prisma
     */
    toPrismaSort(): Record<string, 'asc' | 'desc'> | undefined {
        if (!this.sortBy) {
            return undefined;
        }

        return {
            [this.sortBy]: this.sortOrder || 'desc'
        };
    }

    /**
     * Chuyển đổi filter thành Prisma where condition
     */
    toPrismaWhere(searchFields: string[] = []): any {
        const where: any = {};

        // Search across multiple fields
        if (this.search && searchFields.length > 0) {
            where.OR = searchFields.map(field => ({
                [field]: {
                    contains: this.search,
                    mode: 'insensitive'
                }
            }));
        }

        // Status filter
        if (this.status) {
            where.status = this.status;
        }

        // Date range filter
        if (this.fromDate || this.toDate) {
            where.createdAt = {};

            if (this.fromDate) {
                where.createdAt.gte = new Date(this.fromDate);
            }

            if (this.toDate) {
                where.createdAt.lte = new Date(this.toDate);
            }
        }

        return Object.keys(where).length > 0 ? where : undefined;
    }

    /**
     * Lấy Prisma query options
     */
    toPrismaOptions(searchFields: string[] = []) {
        return {
            skip: this.offset,
            take: this.limit || 10,
            where: this.toPrismaWhere(searchFields),
            orderBy: this.toPrismaSort()
        };
    }
}

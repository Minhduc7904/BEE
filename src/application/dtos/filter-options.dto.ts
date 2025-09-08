// src/application/dtos/filter-options.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterOptionsDto {
    @ApiPropertyOptional({ 
        description: 'Từ khóa tìm kiếm', 
        example: 'admin' 
    })
    @IsOptional()
    @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
    @MaxLength(255, { message: 'Từ khóa tìm kiếm không được vượt quá 255 ký tự' })
    search?: string;

    @ApiPropertyOptional({ 
        description: 'Lọc theo trạng thái', 
        example: 'active' 
    })
    @IsOptional()
    @IsString({ message: 'Trạng thái phải là chuỗi' })
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
     * Chuẩn hóa dữ liệu
     */
    normalize(): void {
        if (this.search) {
            this.search = this.search.trim();
            if (this.search.length === 0) {
                this.search = undefined;
            }
        }

        if (this.status) {
            this.status = this.status.trim().toLowerCase();
            if (this.status.length === 0) {
                this.status = undefined;
            }
        }
    }

    /**
     * Validate date range
     */
    isValidDateRange(): boolean {
        if (!this.fromDate || !this.toDate) {
            return true; // Valid if one or both are missing
        }

        const from = new Date(this.fromDate);
        const to = new Date(this.toDate);
        
        return from <= to;
    }
}

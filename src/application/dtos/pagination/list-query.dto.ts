// src/application/dtos/list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsPositive, Min, Max, IsString, MaxLength, IsIn, IsDateString } from 'class-validator'
import { Trim } from 'src/shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
/**
 * DTO flat cho các query list có pagination, sort và filter
 */
export class ListQueryDto {
  // Pagination properties
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: VALIDATION_MESSAGES.FIELD_INVALID('Số trang') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_INVALID('Số trang') })
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: VALIDATION_MESSAGES.FIELD_INVALID('Kích thước trang') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_INVALID('Kích thước trang') })
  @Max(100, { message: VALIDATION_MESSAGES.FIELD_INVALID('Kích thước trang') })
  limit?: number = 10

  // Search property
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Từ khóa tìm kiếm') })
  @Trim()
  @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Từ khóa tìm kiếm', 255) })
  search?: string

  // Sort properties
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trường sắp xếp') })
  @Trim()
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Tên trường sắp xếp', 50) })
  sortBy?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Thứ tự sắp xếp') })
  @IsIn(['asc', 'desc'], { message: VALIDATION_MESSAGES.FIELD_INVALID('Thứ tự sắp xếp') })
  sortOrder?: 'asc' | 'desc' = 'desc'



  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Từ ngày') })
  fromDate?: string

  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Đến ngày') })
  toDate?: string

  /**
   * Tính toán offset cho database query
   */
  get offset(): number {
    return ((this.page || 1) - 1) * (this.limit || 10)
  }

  /**
   * Chuẩn hóa tất cả dữ liệu
   */
  normalize(): void {
    this.page = Math.max(1, this.page || 1)
    this.limit = Math.min(100, Math.max(1, this.limit || 10))
    this.sortOrder = this.sortOrder === 'asc' ? 'asc' : 'desc'

    // Trim search string
    if (this.search) {
      this.search = this.search.trim()
      if (this.search.length === 0) {
        this.search = undefined
      }
    }

  }

  /**
   * Validate sort field có hợp lệ không
   */
  validateSortField(allowedFields: string[]): boolean {
    if (!this.sortBy) {
      return true // Optional field
    }

    return allowedFields.includes(this.sortBy)
  }

  /**
   * Validate date range
   */
  validateDateRange(): boolean {
    if (!this.fromDate || !this.toDate) {
      return true // Valid if one or both are missing
    }

    const from = new Date(this.fromDate)
    const to = new Date(this.toDate)

    return from <= to
  }

  /**
   * Tạo object sort cho Prisma
   */
  toPrismaSort(): Record<string, 'asc' | 'desc'> | undefined {
    if (!this.sortBy) {
      return undefined
    }

    return {
      [this.sortBy]: this.sortOrder || 'desc',
    }
  }

  /**
   * Chuyển đổi filter thành Prisma where condition
   */
  toPrismaWhere(searchFields: string[] = []): any {
    const where: any = {}

    // Search across multiple fields
    if (this.search && searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: {
          contains: this.search,
          mode: 'insensitive',
        },
      }))
    }

    // Date range filter
    if (this.fromDate || this.toDate) {
      where.createdAt = {}

      if (this.fromDate) {
        where.createdAt.gte = new Date(this.fromDate)
      }

      if (this.toDate) {
        where.createdAt.lte = new Date(this.toDate)
      }
    }

    return Object.keys(where).length > 0 ? where : undefined
  }

  /**
   * Lấy Prisma query options
   */
  toPrismaOptions(searchFields: string[] = []) {
    return {
      skip: this.offset,
      take: this.limit || 10,
      where: this.toPrismaWhere(searchFields),
      orderBy: this.toPrismaSort(),
    }
  }
}

// src/application/dtos/list-query.dto.ts
import { IsOptionalDate, IsOptionalEnumValue, IsOptionalInt, IsOptionalString } from 'src/shared/decorators/validate'
import { IsOptional, IsIn, IsDateString } from 'class-validator'
import { EmptyToUndefined } from 'src/shared/decorators'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

/**
 * Base DTO for list queries with pagination, sorting and filtering
 * 
 * @description Provides common pagination, sorting and date range filtering functionality
 */
export class ListQueryDto {
  /**
   * Page number (minimum 1)
   * @optional
   * @default 1
   * @example 1
   */
  @IsOptionalInt('Số trang', 1, 1000)
  page?: number = 1

  /**
   * Items per page (minimum 1, maximum 1000)
   * @optional
   * @default 10
   * @example 10
   */
  @IsOptionalInt('Kích thước trang', 1, 1000)
  limit?: number = 10

  /**
   * Search keyword
   * @optional
   * @example 'search term'
   */
  @IsOptionalString('Từ khóa tìm kiếm', 255)
  search?: string

  /**
   * Field name to sort by
   * @optional
   * @example 'createdAt'
   */
  @IsOptionalString('Trường sắp xếp', 50)
  sortBy?: string

  /**
   * Sort order (asc or desc)
   * @optional
   * @default 'desc'
   * @example 'desc'
   */
  @IsOptionalEnumValue(SortOrder, 'Thứ tự sắp xếp')
  sortOrder?: SortOrder = SortOrder.DESC

  /**
   * Filter from date (ISO date string)
   * @optional
   * @example '2024-01-01'
   */
  @IsOptionalDate('Từ ngày')
  fromDate?: string

  /**
   * Filter to date (ISO date string)
   * @optional
   * @example '2024-12-31'
   */
  @IsOptionalDate('Đến ngày')
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
    this.limit = Math.min(1000, Math.max(1, this.limit || 10))
    this.sortOrder = this.sortOrder === SortOrder.ASC ? SortOrder.ASC : SortOrder.DESC

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
  toPrismaSort(): Record<string, SortOrder> | undefined {
    if (!this.sortBy) {
      return undefined
    }

    return {
      [this.sortBy]: this.sortOrder || SortOrder.DESC,
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

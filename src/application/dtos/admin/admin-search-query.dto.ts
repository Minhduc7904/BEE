// src/application/dtos/admin/admin-search-query.dto.ts
import { IsOptionalString, IsOptionalBoolean, IsOptionalIdNumber } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

/**
 * DTO for searching admins
 * Fixed pagination: page=1, limit=10
 * Supports: search, isActive, subjectId filters
 */
export class AdminSearchQueryDto {
    @IsOptionalString('Từ khóa tìm kiếm', 255)
    search?: string

    @IsOptionalBoolean('Trạng thái hoạt động')
    isActive?: boolean

    @IsOptionalIdNumber('ID môn học')
    subjectId?: number

    /* ===================== FILTER ===================== */
    toAdminFilterOptions() {
        return {
            search: this.search,
            isActive: this.isActive,
            subjectId: this.subjectId,
        }
    }

    /* ===================== PAGINATION (FIXED) ===================== */
    toAdminPaginationOptions() {
        return {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: SortOrder.DESC,
        }
    }
}

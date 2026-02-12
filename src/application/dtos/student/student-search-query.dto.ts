// src/application/dtos/student/student-search-query.dto.ts
import { IsOptionalString, IsOptionalBoolean, IsOptionalInt } from 'src/shared/decorators/validate'
import { ToNumber, ToBoolean } from 'src/shared/decorators'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { StudentListQueryDto } from './student-list-query.dto'
/**
 * DTO for searching students
 * Fixed pagination: page=1, limit=10
 * Supports: search, grade, isActive filters
 */
export class StudentSearchQueryDto extends StudentListQueryDto {

    /* ===================== PAGINATION (FIXED) ===================== */
    toStudentPaginationOptions() {
        return {
            page: 1,
            limit: 10,
            sortBy: {
                field: 'createdAt' as any,
                direction: SortOrder.DESC,
            },
        }
    }
}

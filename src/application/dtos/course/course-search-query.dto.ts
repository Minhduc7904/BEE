// src/application/dtos/course/course-search-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsNumber, IsString, MaxLength } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { ToNumber } from 'src/shared/decorators'
import { Trim } from 'src/shared/decorators/trim.decorator'
import { IsOptionalString, IsOptionalIdNumber } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
export class CourseSearchQueryDto {
    @IsOptionalString('Từ khóa tìm kiếm', 255)
    search?: string

    @IsOptionalIdNumber('ID giáo viên')
    teacherId?: number

    /* ===================== FILTER ===================== */
    toCourseFilterOptions() {
        return {
            search: this.search,
            teacherId: this.teacherId,
        }
    }

    /* ===================== PAGINATION (FIXED) ===================== */
    toCoursePaginationOptions() {
        return {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: SortOrder.DESC,
        }
    }
}

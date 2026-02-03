// src/application/dtos/course-class/course-class-search-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsNumber, IsArray, IsString, MaxLength,  } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { Trim } from 'src/shared/decorators/trim.decorator'
import { ToNumber, ToNumberArray } from 'src/shared/decorators'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { IsOptionalString, IsOptionalIdNumber, IsOptionalIntArray } from 'src/shared/decorators/validate'

export class CourseClassSearchQueryDto {
    @IsOptionalString('Từ khóa tìm kiếm', 255)
    search?: string

    @IsOptionalIntArray('IDs khóa học')
    courseIds?: number[]

    @IsOptionalIdNumber('ID giáo viên')
    teacherId?: number

    @IsOptionalIdNumber('ID giáo viên')
    instructorId?: number;

    /* ===================== FILTER ===================== */
    toCourseClassFilterOptions() {
        return {
            search: this.search,
            courseIds: this.courseIds,
            teacherId: this.teacherId,
            instructorId: this.instructorId,
        }
    }

    /* ===================== PAGINATION (FIXED) ===================== */
    toCourseClassPaginationOptions() {
        return {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: SortOrder.DESC,
        }
    }
}

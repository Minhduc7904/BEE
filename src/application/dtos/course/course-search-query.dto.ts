// src/application/dtos/course/course-search-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsNumber, IsString, MaxLength } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { ToNumber } from 'src/shared/decorators'
import { Trim } from 'src/shared/decorators/trim.decorator'

export class CourseSearchQueryDto {
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Từ khóa tìm kiếm') })
    @Trim()
    @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Từ khóa tìm kiếm', 255) })
    search?: string

    @IsOptional()
    @ToNumber() 
    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giáo viên') })
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
            sortOrder: 'desc' as const,
        }
    }
}

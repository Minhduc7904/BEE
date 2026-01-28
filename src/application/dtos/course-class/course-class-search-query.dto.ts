// src/application/dtos/course-class/course-class-search-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsNumber, IsArray, IsString, MaxLength,  } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { Trim } from 'src/shared/decorators/trim.decorator'
import { ToNumber, ToNumberArray } from 'src/shared/decorators'

export class CourseClassSearchQueryDto {
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Từ khóa tìm kiếm') })
    @Trim()
    @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Từ khóa tìm kiếm', 255) })
    search?: string

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @ToNumberArray()
    courseIds?: number[]

    @IsOptional()
    @ToNumber()
    @IsNumber({}, { message: 'Giáo viên không hợp lệ' })
    teacherId?: number

    @IsOptional()
    @ToNumber()
    @IsNumber({}, { message: 'Giáo viên không hợp lệ' })
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
            sortOrder: 'desc' as const,
        }
    }
}

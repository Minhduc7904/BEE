// src/application/dtos/course/course-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator'
import { ListQueryDto } from '../pagination/list-query.dto'
import { Trim, ToBoolean } from 'src/shared/decorators'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { Visibility } from 'src/domain/entities'

export class CourseListQueryDto extends ListQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Khối') })
    @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Khối', 1) })
    @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Khối', 12) })
    grade?: number

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Môn học') })
    subjectId?: number

    @IsOptional()
    @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], { message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái') })
    visibility?: Visibility

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giảng viên') })
    teacherId?: number

    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Năm học') })
    @Trim()
    academicYear?: string

    /**
     * Chuyển đổi DTO thành filter options cho repository
     */
    toCourseFilterOptions() {
        return {
            grade: this.grade,
            subjectId: this.subjectId,
            visibility: this.visibility,
            teacherId: this.teacherId,
            academicYear: this.academicYear,
            search: this.search,
        }
    }

    /**
     * Chuyển đổi thành pagination options cho repository
     */
    toCoursePaginationOptions() {
        const sortField = this.sortBy || 'createdAt'
        const sortDirection = this.sortOrder || 'desc'

        // Validate sort field
        const allowedSortFields = [
            'courseId',
            'title',
            'grade',
            'priceVND',
            'visibility',
            'createdAt',
            'updatedAt',
        ]

        const validatedSortField = allowedSortFields.includes(sortField) ? sortField : 'createdAt'

        return {
            page: this.page || 1,
            limit: this.limit || 10,
            sortBy: validatedSortField,
            sortOrder: sortDirection as 'asc' | 'desc',
        }
    }
}

// src/application/dtos/course/course-list-query.dto.ts
import { ListQueryDto } from '../pagination/list-query.dto'
import { Trim, ToNumber } from 'src/shared/decorators'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { CourseVisibility } from 'src/shared/enums'
import { IsOptionalInt, IsOptionalIdNumber, IsOptionalEnumValue, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO truy vấn danh sách khóa học
 * @description Chứa các tham số lọc và phân trang cho danh sách khóa học
 */
export class CourseListQueryDto extends ListQueryDto {
    /**
     * Khối lớp (1-12)
     * @optional
     * @example 10
     */
    @ToNumber()
    @IsOptionalInt('Khối', 1, 12)
    grade?: number

    /**
     * ID môn học
     * @optional
     * @example 5
     */
    @ToNumber()
    @IsOptionalIdNumber('Môn học')
    subjectId?: number

    /**
     * Trạng thái hiển thị
     * @optional
     * @example "PUBLIC"
     */
    @IsOptionalEnumValue(CourseVisibility, 'Trạng thái')
    visibility?: CourseVisibility

    /**
     * ID giáo viên
     * @optional
     * @example 3
     */
    @ToNumber()
    @IsOptionalIdNumber('Giáo viên')
    teacherId?: number

    /**
     * Năm học
     * @optional
     * @example "2024-2025"
     */
    @IsOptionalString('Năm học')
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

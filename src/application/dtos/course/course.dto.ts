// src/application/dtos/course/course.dto.ts
import { Course } from '../../../domain/entities'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export class CourseResponseDto {
    courseId: number
    title: string
    subtitle?: string
    academicYear?: string
    grade?: number
    subjectId?: number
    subjectName?: string
    description?: string
    priceVND: number
    compareAtVND?: number
    visibility: string
    teacherId?: number
    teacherName?: string
    isUpdatable: boolean
    createdAt: Date
    updatedAt: Date

    // Computed fields
    isFree?: boolean
    hasDiscount?: boolean
    discountPercentage?: number

    static fromEntity(course: Course): CourseResponseDto {
        return {
            courseId: course.courseId,
            title: course.title,
            subtitle: course.subtitle,
            academicYear: course.academicYear,
            grade: course.grade,
            subjectId: course.subjectId,
            subjectName: course.subject?.name,
            description: course.description,
            priceVND: course.priceVND,
            compareAtVND: course.compareAtVND,
            visibility: course.visibility,
            teacherId: course.teacherId,
            teacherName: course.teacher ? `${course.teacher.user?.firstName} ${course.teacher.user?.lastName}` : undefined,
            isUpdatable: course.isUpdatable,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            isFree: course.isFree(),
            hasDiscount: course.hasDiscount(),
            discountPercentage: course.getDiscountPercentage(),
        }
    }

    static fromEntities(courses: Course[]): CourseResponseDto[] {
        return courses.map(course => this.fromEntity(course))
    }
}

export class CourseListResponseDto extends PaginationResponseDto<CourseResponseDto> {
    constructor(
        data: CourseResponseDto[],
        page: number,
        limit: number,
        total: number,
    ) {
        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasPrevious: page > 1,
            hasNext: page < Math.ceil(total / limit),
            previousPage: page > 1 ? page - 1 : undefined,
            nextPage: page < Math.ceil(total / limit) ? page + 1 : undefined,
        }
        super(true, 'Lấy danh sách khóa học thành công', data, meta)
    }
}

// src/application/dtos/lesson/lesson.dto.ts
import { Lesson } from '../../../domain/entities'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export class LessonResponseDto {
    lessonId: number
    courseId: number
    courseName?: string
    title: string
    description?: string
    teacherId?: number
    teacherName?: string
    createdAt: Date
    updatedAt: Date

    // Computed fields
    hasDescription?: boolean
    hasTeacher?: boolean
    learningItemsCount?: number

    static fromEntity(lesson: Lesson): LessonResponseDto {
        return {
            lessonId: lesson.lessonId,
            courseId: lesson.courseId,
            courseName: lesson.course?.title,
            title: lesson.title,
            description: lesson.description ?? undefined,
            teacherId: lesson.teacherId ?? undefined,
            teacherName: lesson.teacher ? `${lesson.teacher.user?.firstName} ${lesson.teacher.user?.lastName}` : undefined,
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt,
            hasDescription: lesson.hasDescription(),
            hasTeacher: lesson.hasTeacher(),
            learningItemsCount: lesson.getLearningItemsCount(),
        }
    }

    static fromEntities(lessons: Lesson[]): LessonResponseDto[] {
        return lessons.map(lesson => this.fromEntity(lesson))
    }
}

export class LessonListResponseDto extends PaginationResponseDto<LessonResponseDto> {
    constructor(
        data: LessonResponseDto[],
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
        super(true, 'Lấy danh sách bài học thành công', data, meta)
    }
}

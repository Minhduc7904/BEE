// src/application/dtos/lesson/lesson.dto.ts
import { Lesson } from '../../../domain/entities'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { Visibility } from '../../../shared/enums'
import { LearningItemResponseDto } from '../learningItem'
export class LessonResponseDto {
    lessonId: number
    courseId: number
    courseName?: string
    title: string
    description?: string
    visibility: Visibility
    orderInCourse: number
    teacherId?: number
    teacherName?: string
    allowTrial: boolean
    createdAt: Date
    updatedAt: Date

    // Relations
    chapters?: { chapterId: number; chapterName: string }[]
    learningItems?: { 
        learningItemId: number; 
        learningItemName: string;
        type: string;
        order?: number;
    }[]
    learningItemsCount?: number

    // Computed fields
    hasDescription?: boolean
    hasTeacher?: boolean
    isDraft?: boolean
    isPublished?: boolean

    static fromEntity(lesson: Lesson): LessonResponseDto {
        return {
            lessonId: lesson.lessonId,
            courseId: lesson.courseId,
            courseName: lesson.course?.title,
            title: lesson.title,
            description: lesson.description ?? undefined,
            visibility: lesson.visibility,
            orderInCourse: lesson.orderInCourse,
            teacherId: lesson.teacherId ?? undefined,
            teacherName: lesson.teacher ? `${lesson.teacher.user?.firstName} ${lesson.teacher.user?.lastName}` : undefined,
            allowTrial: lesson.allowTrial,
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt,
            chapters: lesson.lessonChapters?.map(lc => ({
                chapterId: lc.chapter?.chapterId ?? 0,
                chapterName: lc.chapter?.name ?? '',
            })),
            learningItems: lesson.learningItems?.map(li => ({
                learningItemId: li.learningItem?.learningItemId ?? 0,
                learningItemName: li.learningItem?.title ?? '',
                type: li.learningItem?.type ?? '',
                order: li.order ?? undefined,
            })),
            learningItemsCount: lesson.getLearningItemsCount(),
            hasDescription: lesson.hasDescription(),
            hasTeacher: lesson.hasTeacher(),
            isDraft: lesson.isDraft(),
            isPublished: lesson.isPublished(),
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

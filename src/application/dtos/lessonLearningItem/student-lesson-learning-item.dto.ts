import { LearningItemType } from '../../../shared/enums'
import { BaseResponseDto } from '../common/base-response.dto'
import { StudentLearningItemStateResponseDto } from '../studentLearningItem'

export class StudentLessonLearningItemLearningItemDto {
    learningItemId: number
    type: LearningItemType
    title: string
    description?: string
    createdAt: Date
    updatedAt: Date
    isLearned: boolean
    learnedAt?: Date
    studentLearningItem: StudentLearningItemStateResponseDto | null
}

export class StudentLessonLearningItemResponseDto {
    lessonId: number
    learningItemId: number
    order?: number
    createdAt: Date
    lesson?: {
        lessonId: number
        title: string
        courseId: number
    }
    learningItem: StudentLessonLearningItemLearningItemDto

    static fromPrisma(lessonLearningItem: any): StudentLessonLearningItemResponseDto {
        const studentLearningItem =
            lessonLearningItem.learningItem?.studentLearningItems?.[0] ?? null
        const studentLearningItemDto =
            StudentLearningItemStateResponseDto.fromPrisma(studentLearningItem)

        const dto = new StudentLessonLearningItemResponseDto()
        dto.lessonId = lessonLearningItem.lessonId
        dto.learningItemId = lessonLearningItem.learningItemId
        dto.order = lessonLearningItem.order ?? undefined
        dto.createdAt = lessonLearningItem.createdAt

        if (lessonLearningItem.lesson) {
            dto.lesson = {
                lessonId: lessonLearningItem.lesson.lessonId,
                title: lessonLearningItem.lesson.title,
                courseId: lessonLearningItem.lesson.courseId,
            }
        }

        dto.learningItem = {
            learningItemId: lessonLearningItem.learningItem.learningItemId,
            type: lessonLearningItem.learningItem.type,
            title: lessonLearningItem.learningItem.title,
            description: lessonLearningItem.learningItem.description ?? undefined,
            createdAt: lessonLearningItem.learningItem.createdAt,
            updatedAt: lessonLearningItem.learningItem.updatedAt,
            isLearned: studentLearningItemDto?.isLearned ?? false,
            learnedAt: studentLearningItemDto?.learnedAt,
            studentLearningItem: studentLearningItemDto,
        }

        return dto
    }
}

export class StudentLessonLearningItemListResponseDto extends BaseResponseDto<StudentLessonLearningItemResponseDto[]> { }

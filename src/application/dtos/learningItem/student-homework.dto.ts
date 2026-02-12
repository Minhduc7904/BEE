// src/application/dtos/learningItem/student-homework.dto.ts
import { LearningItem } from 'src/domain/entities'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export class StudentHomeworkResponseDto {
    learningItemId: number
    title: string
    description?: string
    type: string
    createdAt: Date

    // Homework specific
    homeworkContentId?: number
    homeworkContent?: string
    dueDate?: Date
    allowLateSubmit: boolean
    competitionId?: number

    // Student progress
    isLearned: boolean
    learnedAt?: Date
    isOverdue: boolean
    isSubmitted: boolean
    submittedAt?: Date
    points?: number
    feedback?: string

    // Lesson info
    lessonId?: number
    lessonTitle?: string

    constructor(data: {
        learningItem: LearningItem
        homeworkContent?: any
        studentLearningItem?: any
        homeworkSubmit?: any
        lesson?: any
    }) {
        this.learningItemId = data.learningItem.learningItemId
        this.title = data.learningItem.title
        this.description = data.learningItem.description ? data.learningItem.description : undefined
        this.type = data.learningItem.type
        this.createdAt = data.learningItem.createdAt

        // Homework content
        if (data.homeworkContent) {
            this.homeworkContentId = data.homeworkContent.homeworkContentId
            this.homeworkContent = data.homeworkContent.content
            this.dueDate = data.homeworkContent.dueDate
            this.allowLateSubmit = data.homeworkContent.allowLateSubmit
            this.competitionId = data.homeworkContent.competitionId
        }

        // Student progress
        this.isLearned = data.studentLearningItem?.isLearned ?? false
        this.learnedAt = data.studentLearningItem?.learnedAt
        
        // Check if overdue
        this.isOverdue = false
        if (this.dueDate && !this.isLearned && !this.allowLateSubmit) {
            this.isOverdue = new Date() > new Date(this.dueDate)
        }

        // Homework submit
        this.isSubmitted = !!data.homeworkSubmit
        if (data.homeworkSubmit) {
            this.submittedAt = data.homeworkSubmit.submitAt
            this.points = data.homeworkSubmit.points
            this.feedback = data.homeworkSubmit.feedback
        }

        // Lesson info
        if (data.lesson) {
            this.lessonId = data.lesson.lessonId
            this.lessonTitle = data.lesson.title
        }
    }
}

export class StudentHomeworkListResponseDto extends PaginationResponseDto<StudentHomeworkResponseDto> {
    constructor(
        data: StudentHomeworkResponseDto[],
        page: number,
        limit: number,
        total: number,
    ) {
        const totalPages = Math.ceil(total / limit)
        const hasPrevious = page > 1
        const hasNext = page < totalPages
        const previousPage = hasPrevious ? page - 1 : undefined
        const nextPage = hasNext ? page + 1 : undefined

        const meta = {
            page,
            limit,
            total,
            totalPages,
            hasPrevious,
            hasNext,
            previousPage,
            nextPage,
        }

        super(true, 'Lấy danh sách bài tập thành công', data, meta)
    }
}

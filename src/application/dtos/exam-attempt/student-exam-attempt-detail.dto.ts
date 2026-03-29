import { BaseResponseDto } from '../common/base-response.dto'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'
import { ExamAttempt } from '../../../domain/entities/exam/exam-attempt.entity'
import { TypeOfExam } from '../../../shared/enums'

export class StudentExamAttemptDetailDto {
    attemptId: number
    examId: number
    examTitle?: string
    typeOfExam?: TypeOfExam | null
    studentId: number
    status: ExamAttemptStatus
    startedAt: Date
    endAt?: Date
    duration?: number
    expectedEndAt?: Date
    remainingSeconds?: number
    remainingMinutes?: number
    isOverTime: boolean
    points?: number
    maxPoints?: number
    questionIds: number[]
    questionCount: number

    static fromEntity(entity: ExamAttempt, now = new Date()): StudentExamAttemptDetailDto {
        const dto = new StudentExamAttemptDetailDto()

        dto.attemptId = entity.attemptId
        dto.examId = entity.examId
        dto.examTitle = entity.exam?.title
        dto.typeOfExam = entity.exam?.typeOfExam ?? undefined
        dto.studentId = entity.studentId
        dto.status = entity.status
        dto.startedAt = entity.startedAt
        dto.endAt = entity.endAt ?? undefined
        dto.duration = entity.duration ?? undefined
        if (entity.status !== ExamAttemptStatus.IN_PROGRESS) {
            dto.points = entity.points ?? undefined
            dto.maxPoints = entity.maxPoints ?? undefined
        }
        dto.questionIds = entity.getQuestionIds()
        dto.questionCount = dto.questionIds.length

        dto.isOverTime = false

        if (entity.duration && entity.duration > 0) {
            const expectedEndAt = new Date(entity.startedAt.getTime() + entity.duration * 60 * 1000)
            dto.expectedEndAt = expectedEndAt

            if (entity.status === ExamAttemptStatus.IN_PROGRESS) {
                const remainingMs = expectedEndAt.getTime() - now.getTime()
                const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000))

                dto.remainingSeconds = remainingSeconds
                dto.remainingMinutes = Math.floor(remainingSeconds / 60)
                dto.isOverTime = remainingMs < 0
            } else {
                dto.remainingSeconds = 0
                dto.remainingMinutes = 0
                if (entity.endAt) {
                    dto.isOverTime = entity.endAt.getTime() > expectedEndAt.getTime()
                }
            }
        }

        return dto
    }
}

export class StudentExamAttemptDetailResponseDto extends BaseResponseDto<StudentExamAttemptDetailDto> {
    static fromEntity(entity: ExamAttempt): StudentExamAttemptDetailResponseDto {
        return BaseResponseDto.success(
            'Lấy chi tiết lượt làm bài thành công',
            StudentExamAttemptDetailDto.fromEntity(entity),
        )
    }
}

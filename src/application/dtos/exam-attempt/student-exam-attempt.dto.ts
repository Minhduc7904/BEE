import { ExamAttempt } from '../../../domain/entities/exam/exam-attempt.entity'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'
import { BaseResponseDto } from '../common/base-response.dto'

export class StudentExamAttemptItemDto {
  attemptId: number
  examId: number
  examTitle?: string
  status: ExamAttemptStatus
  score?: number
  points?: number
  maxPoints?: number
  startedAt: Date
  endAt?: Date
  questionCount: number

  static fromEntity(entity: ExamAttempt): StudentExamAttemptItemDto {
    const dto = new StudentExamAttemptItemDto()
    dto.attemptId = entity.attemptId
    dto.examId = entity.examId
    dto.examTitle = entity.exam?.title
    dto.status = entity.status
    dto.score = entity.score ?? undefined
    dto.points = entity.points ?? undefined
    dto.maxPoints = entity.maxPoints ?? undefined
    dto.startedAt = entity.startedAt
    dto.endAt = entity.endAt ?? undefined
    dto.questionCount = entity.getQuestionCount()
    return dto
  }
}

export class StudentExamAttemptListResponseDto extends BaseResponseDto<{
  examAttempts: StudentExamAttemptItemDto[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}> {
  static fromResult(
    examAttempts: StudentExamAttemptItemDto[],
    page: number,
    limit: number,
    total: number,
  ): StudentExamAttemptListResponseDto {
    return BaseResponseDto.success('Lấy danh sách lượt làm bài của học sinh thành công', {
      examAttempts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  }
}

import { QuestionAnswer } from '../../../domain/entities/exam/question-answer.entity'
import { BaseResponseDto } from '../common/base-response.dto'

export class StudentQuestionAnswerItemDto {
  questionAnswerId: number
  attemptId: number
  examId?: number
  examTitle?: string
  questionId: number
  questionContent?: string
  answer?: string
  selectedStatementIds?: number[]
  isCorrect?: boolean
  points?: number
  maxPoints?: number
  timeSpentSeconds?: number
  startedAt?: Date
  endAt?: Date

  static fromEntity(entity: QuestionAnswer): StudentQuestionAnswerItemDto {
    const dto = new StudentQuestionAnswerItemDto()

    dto.questionAnswerId = entity.questionAnswerId
    dto.attemptId = entity.attemptId
    dto.examId = entity.examAttempt?.examId
    dto.examTitle = entity.examAttempt?.exam?.title
    dto.questionId = entity.questionId
    dto.questionContent = entity.question?.content
    dto.answer = entity.answer ?? undefined
    dto.selectedStatementIds = entity.selectedStatementIds ?? undefined
    dto.isCorrect = entity.isCorrect ?? undefined
    dto.points = entity.points ?? undefined
    dto.maxPoints = entity.maxPoints ?? undefined
    dto.timeSpentSeconds = entity.timeSpentSeconds ?? undefined
    dto.startedAt = entity.examAttempt?.startedAt ?? undefined
    dto.endAt = entity.examAttempt?.endAt ?? undefined

    return dto
  }
}

export class StudentQuestionAnswerListResponseDto extends BaseResponseDto<{
  questionAnswers: StudentQuestionAnswerItemDto[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}> {
  static fromResult(
    questionAnswers: StudentQuestionAnswerItemDto[],
    page: number,
    limit: number,
    total: number,
  ): StudentQuestionAnswerListResponseDto {
    return BaseResponseDto.success('Lấy danh sách câu trả lời của học sinh thành công', {
      questionAnswers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  }
}

import { QuestionAnswer } from '../../../domain/entities/exam/question-answer.entity'
import { BaseResponseDto } from '../common/base-response.dto'
import { ExamAttemptStatus } from '../../../shared/enums'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export class StudentQuestionAnswerItemDto {
  questionAnswerId: number
  attemptId?: number
  examId?: number
  examTitle?: string
  questionId: number
  questionContent?: string
  processedQuestionContent?: string
  statements?: StudentQuestionAnswerStatementDto[]
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
    dto.attemptId = entity.attemptId ?? undefined
    dto.examId = entity.examAttempt?.examId
    dto.examTitle = entity.examAttempt?.exam?.title
    dto.questionId = entity.questionId
    dto.questionContent = entity.question?.content
    dto.processedQuestionContent = undefined
    dto.statements = entity.question?.statements
      ?.slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((statement) => StudentQuestionAnswerStatementDto.fromEntity(statement))
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

  static fromEntityByAttemptStatus(
    entity: QuestionAnswer,
    attemptStatus: ExamAttemptStatus,
  ): StudentQuestionAnswerItemDto {
    const dto = StudentQuestionAnswerItemDto.fromEntity(entity)

    if (attemptStatus === ExamAttemptStatus.IN_PROGRESS) {
      dto.isCorrect = undefined
      dto.points = undefined
      dto.maxPoints = undefined
    }

    return dto
  }
}

export class StudentQuestionAnswerStatementDto {
  statementId: number
  content: string
  processedContent?: string
  order?: number

  static fromEntity(entity: { statementId: number; content: string; order?: number | null }): StudentQuestionAnswerStatementDto {
    const dto = new StudentQuestionAnswerStatementDto()

    dto.statementId = entity.statementId
    dto.content = entity.content
    dto.processedContent = undefined
    dto.order = entity.order ?? undefined

    return dto
  }
}

export class StudentQuestionAnswerByAttemptResponseDto extends BaseResponseDto<{
  attemptId: number
  status: ExamAttemptStatus
  questionAnswers: StudentQuestionAnswerItemDto[]
}> {
  static fromResult(
    attemptId: number,
    status: ExamAttemptStatus,
    questionAnswers: StudentQuestionAnswerItemDto[],
  ): StudentQuestionAnswerByAttemptResponseDto {
    return BaseResponseDto.success('Lấy danh sách câu trả lời theo lượt làm bài thành công', {
      attemptId,
      status,
      questionAnswers,
    })
  }
}

export class StudentQuestionAnswerListResponseDto extends PaginationResponseDto<StudentQuestionAnswerItemDto> {
  static fromResult(
    questionAnswers: StudentQuestionAnswerItemDto[],
    page: number,
    limit: number,
    total: number,
  ): StudentQuestionAnswerListResponseDto {
    return PaginationResponseDto.success(
      'Lấy danh sách câu trả lời của học sinh thành công',
      questionAnswers,
      page,
      limit,
      total,
    ) as StudentQuestionAnswerListResponseDto
  }
}

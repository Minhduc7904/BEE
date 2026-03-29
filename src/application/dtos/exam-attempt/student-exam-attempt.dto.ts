import { ExamAttempt } from '../../../domain/entities/exam/exam-attempt.entity'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'
import { TypeOfExam } from '../../../shared/enums'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export class StudentExamAttemptItemDto {
  attemptId: number
  examId: number
  examTitle?: string
  typeOfExam?: TypeOfExam | null
  status: ExamAttemptStatus
  duration?: number
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
    dto.typeOfExam = entity.exam?.typeOfExam ?? undefined
    dto.status = entity.status
    dto.duration = entity.duration ?? undefined
    if (entity.status !== ExamAttemptStatus.IN_PROGRESS) {
      dto.points = entity.points ?? undefined
      dto.maxPoints = entity.maxPoints ?? undefined
    }
    dto.startedAt = entity.startedAt
    dto.endAt = entity.endAt ?? undefined
    dto.questionCount = entity.getQuestionCount()
    return dto
  }
}

export class StudentExamAttemptListResponseDto extends PaginationResponseDto<StudentExamAttemptItemDto> {
  static fromResult(
    examAttempts: StudentExamAttemptItemDto[],
    page: number,
    limit: number,
    total: number,
  ): StudentExamAttemptListResponseDto {
    return PaginationResponseDto.success(
      'Lấy danh sách lượt làm bài của học sinh thành công',
      examAttempts,
      page,
      limit,
      total,
    ) as StudentExamAttemptListResponseDto
  }
}

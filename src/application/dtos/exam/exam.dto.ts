// src/application/dtos/exam/exam.dto.ts
import { Exam } from '../../../domain/entities/exam/exam.entity'
import { QuestionExam } from '../../../domain/entities/exam/question-exam.entity'
import { Competition } from '../../../domain/entities/exam/competition.entity'
import { ExamVisibility, TypeOfExam } from '../../../shared/enums'
import { Subject } from '../../../domain/entities/subject/subject.entity'
import { PaginationResponseDto, PaginationMetaDto } from '../pagination/pagination-response.dto'

export class QuestionExamResponseDto {
  questionId: number
  examId: number
  sectionId: number | null
  order: number
  points?: number | null
  createdAt: Date

  static fromEntity(questionExam: QuestionExam): QuestionExamResponseDto {
    const dto = new QuestionExamResponseDto()
    dto.questionId = questionExam.questionId
    dto.examId = questionExam.examId
    dto.sectionId = questionExam.sectionId
    dto.order = questionExam.order
    dto.points = questionExam.points
    dto.createdAt = questionExam.createdAt
    return dto
  }

  static fromEntities(questionExams: QuestionExam[]): QuestionExamResponseDto[] {
    return questionExams.map((qe) => QuestionExamResponseDto.fromEntity(qe))
  }
}

export class CompetitionResponseDto {
  competitionId: number
  title: string
  subtitle?: string | null
  examId?: number | null
  policies?: string | null
  startDate: Date
  endDate: Date
  durationMinutes?: number | null
  maxAttempts?: number | null
  visibility: string
  showResultDetail: boolean
  allowLeaderboard: boolean
  allowViewScore: boolean
  allowViewAnswer: boolean
  enableAntiCheating: boolean
  createdBy: number
  createdAt: Date
  updatedAt: Date

  static fromEntity(competition: Competition): CompetitionResponseDto {
    const dto = new CompetitionResponseDto()
    dto.competitionId = competition.competitionId
    dto.title = competition.title
    dto.subtitle = competition.subtitle
    dto.examId = competition.examId
    dto.policies = competition.policies
    dto.startDate = competition.startDate
    dto.endDate = competition.endDate
    dto.durationMinutes = competition.durationMinutes
    dto.maxAttempts = competition.maxAttempts
    dto.visibility = competition.visibility
    dto.showResultDetail = competition.showResultDetail
    dto.allowLeaderboard = competition.allowLeaderboard
    dto.allowViewScore = competition.allowViewScore
    dto.allowViewAnswer = competition.allowViewAnswer
    dto.enableAntiCheating = competition.enableAntiCheating
    dto.createdBy = competition.createdBy
    dto.createdAt = competition.createdAt
    dto.updatedAt = competition.updatedAt
    return dto
  }

  static fromEntities(competitions: Competition[]): CompetitionResponseDto[] {
    return competitions.map((c) => CompetitionResponseDto.fromEntity(c))
  }
}

export class ExamResponseDto {
  // Identity
  examId: number
  title: string
  description?: string | null
  grade?: number
  visibility: ExamVisibility

  // References
  subjectId?: number | null
  subjectName?: string | null
  createdBy: number

  // Creator Information
  createdByAdmin?: {
    adminId: number
    userId: number
    firstName: string
    lastName: string
    fullName: string
    email?: string
  } | null

  // Media
  solutionYoutubeUrl?: string | null

  // Type of exam
  typeOfExam?: TypeOfExam | null

  // Relations
  subject?: Subject | null
  questions?: QuestionExamResponseDto[]
  competitions?: CompetitionResponseDto[]

  // Metadata
  createdAt: Date
  updatedAt: Date

  // Computed
  hasDescription: boolean
  hasSolution: boolean
  isPublished: boolean
  isDraft: boolean
  questionCount: number
  competitionCount: number

  // Processed content with presigned URLs
  processedDescription?: string | null

  static fromEntity(exam: Exam): ExamResponseDto {
    const dto = new ExamResponseDto()

    // Identity
    dto.examId = exam.examId
    dto.title = exam.title
    dto.description = exam.description
    dto.grade = exam.grade
    dto.visibility = exam.visibility

    // References
    dto.subjectId = exam.subjectId
    dto.subjectName = exam.subject?.name || null
    dto.createdBy = exam.createdBy

    // Creator Information
    if (exam.admin?.user) {
      dto.createdByAdmin = {
        adminId: exam.admin.adminId,
        userId: exam.admin.user.userId,
        firstName: exam.admin.user.firstName,
        lastName: exam.admin.user.lastName,
        fullName: exam.admin.user.getFullName(),
        email: exam.admin.user.email,
      }
    } else {
      dto.createdByAdmin = null
    }

    // Media
    dto.solutionYoutubeUrl = exam.solutionYoutubeUrl

    // Type of exam
    dto.typeOfExam = exam.typeOfExam

    // Relations
    dto.subject = exam.subject || null
    dto.questions = exam.questions ? QuestionExamResponseDto.fromEntities(exam.questions) : []
    dto.competitions = exam.competitions ? CompetitionResponseDto.fromEntities(exam.competitions) : []

    // Metadata
    dto.createdAt = exam.createdAt
    dto.updatedAt = exam.updatedAt

    // Computed
    dto.hasDescription = exam.hasDescription()
    dto.hasSolution = Boolean(exam.solutionYoutubeUrl)
    dto.isPublished = exam.isPublished()
    dto.isDraft = exam.isDraft()
    dto.questionCount = exam.questionCount ?? exam.questions?.length ?? 0
    dto.competitionCount = exam.competitions?.length || 0

    return dto
  }

  static fromEntities(exams: Exam[]): ExamResponseDto[] {
    return exams.map((exam) => ExamResponseDto.fromEntity(exam))
  }
}

export class ExamListResponseDto extends PaginationResponseDto<ExamResponseDto> {
  constructor(data: ExamResponseDto[], page: number, limit: number, total: number) {
    const meta = new PaginationMetaDto(page, limit, total)
    super(true, 'Lấy danh sách đề thi thành công', data, meta)
  }

  static fromEntities(exams: Exam[], page: number, limit: number, total: number): ExamListResponseDto {
    const data = exams.map((exam) => ExamResponseDto.fromEntity(exam))
    return new ExamListResponseDto(data, page, limit, total)
  }
}

// src/application/dtos/question/question.dto.ts
import { Question } from '../../../domain/entities/exam/question.entity'
import { Statement } from '../../../domain/entities/exam/statement.entity'
import { QuestionChapter } from '../../../domain/entities/exam/question-chapter.entity'
import { QuestionType, Difficulty, Visibility } from '../../../shared/enums'
import { Subject } from '../../../domain/entities/subject/subject.entity'
import { PaginationResponseDto, PaginationMetaDto } from '../pagination/pagination-response.dto'

export class StatementResponseDto {
  statementId: number
  content: string
  processedContent?: string
  isCorrect: boolean
  order?: number | null
  difficulty?: Difficulty | null
  createdAt: Date
  updatedAt: Date

  static fromEntity(statement: Statement): StatementResponseDto {
    return {
      statementId: statement.statementId,
      content: statement.content,
      processedContent: undefined, // Will be set by use case
      isCorrect: statement.isCorrect,
      order: statement.order ?? null,
      difficulty: statement.difficulty ?? null,
      createdAt: statement.createdAt,
      updatedAt: statement.updatedAt,
    }
  }
}

export class QuestionResponseDto {
  // ===== Identity =====
  questionId: number

  // ===== Content =====
  content: string
  processedContent?: string
  type: QuestionType
  correctAnswer?: string | null
  solution?: string | null
  processedSolution?: string | null
  solutionYoutubeUrl?: string | null

  // ===== Classification =====
  difficulty?: Difficulty | null
  grade?: number | null
  subjectId?: number | null
  subjectName?: string
  pointsOrigin?: number | null

  // ===== State =====
  visibility: Visibility

  // ===== Relations =====
  subject?: Subject
  questionChapters?: QuestionChapter[]
  statements?: StatementResponseDto[]

  // ===== Metadata =====
  createdBy?: number | null
  createdAt: Date
  updatedAt: Date

  // ===== Computed =====
  hasCorrectAnswer: boolean
  hasSolution: boolean
  hasSolutionYoutube: boolean
  hasStatements: boolean
  hasChapters: boolean

  static fromEntity(question: Question): QuestionResponseDto {
    return {
      // Identity
      questionId: question.questionId,

      // Content
      content: question.content,
      processedContent: undefined, // Will be set by use case
      type: question.type,
      correctAnswer: question.correctAnswer ?? null,
      solution: question.solution ?? null,
      processedSolution: undefined, // Will be set by use case
      solutionYoutubeUrl: question.solutionYoutubeUrl ?? null,

      // Classification
      difficulty: question.difficulty ?? null,
      grade: question.grade ?? null,
      subjectId: question.subjectId ?? null,
      subjectName: question.subject?.name,
      pointsOrigin: question.pointsOrigin ?? null,

      // State
      visibility: question.visibility,

      // Relations
      subject: question.subject ?? undefined,
      questionChapters: question.questionChapters,
      statements: question.statements?.map((stmt) => StatementResponseDto.fromEntity(stmt)),

      // Metadata
      createdBy: question.createdBy ?? null,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,

      // Computed
      hasCorrectAnswer: question.hasCorrectAnswer(),
      hasSolution: question.hasSolution(),
      hasSolutionYoutube: question.hasSolutionYoutube(),
      hasStatements: question.hasStatements(),
      hasChapters: question.hasChapters(),
    }
  }

  static fromEntities(questions: Question[]): QuestionResponseDto[] {
    return questions.map((question) => QuestionResponseDto.fromEntity(question))
  }
}

export class QuestionListResponseDto extends PaginationResponseDto<QuestionResponseDto> {
  constructor(data: QuestionResponseDto[], page: number, limit: number, total: number) {
    const meta = new PaginationMetaDto(page, limit, total)
    super(true, 'Lấy danh sách câu hỏi thành công', data, meta)
  }

  static fromEntities(
    questions: Question[],
    page: number,
    limit: number,
    total: number,
  ): QuestionListResponseDto {
    const data = questions.map((question) => QuestionResponseDto.fromEntity(question))
    return new QuestionListResponseDto(data, page, limit, total)
  }
}

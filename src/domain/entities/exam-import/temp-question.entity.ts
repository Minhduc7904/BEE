// src/domain/entities/exam-import/temp-question.entity.ts

import { QuestionType, Difficulty } from '../../../shared/enums'
import { Subject } from '../subject/subject.entity'
import { Question } from '../exam/question.entity'
import { ExamImportSession } from './exam-import-session.entity'
import { TempSection } from './temp-section.entity'
import { TempStatement } from './temp-statement.entity'

export class TempQuestion {
  // Required properties
  tempQuestionId: string
  sessionId: string
  content: string
  type: QuestionType
  order: number
  createdAt: Date
  updatedAt: Date

  // Optional properties
  tempSectionId?: string | null
  correctAnswer?: string | null
  solution?: string | null
  difficulty?: Difficulty | null
  solutionYoutubeUrl?: string | null
  grade?: number | null
  subjectId?: number | null
  pointsOrigin?: number | null
  metadata?: any | null
  questionId?: number | null

  // Relations
  session?: ExamImportSession | null
  tempSection?: TempSection | null
  subject?: Subject | null
  finalQuestion?: Question | null
  tempStatements?: TempStatement[]

  constructor(data: {
    tempQuestionId: string
    sessionId: string
    content: string
    type: QuestionType
    order: number
    createdAt: Date
    updatedAt: Date
    tempSectionId?: string | null
    correctAnswer?: string | null
    solution?: string | null
    difficulty?: Difficulty | null
    solutionYoutubeUrl?: string | null
    grade?: number | null
    subjectId?: number | null
    pointsOrigin?: number | null
    metadata?: any | null
    questionId?: number | null
    session?: ExamImportSession | null
    tempSection?: TempSection | null
    subject?: Subject | null
    finalQuestion?: Question | null
    tempStatements?: TempStatement[]
  }) {
    this.tempQuestionId = data.tempQuestionId
    this.sessionId = data.sessionId
    this.content = data.content
    this.type = data.type
    this.order = data.order
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.tempSectionId = data.tempSectionId
    this.correctAnswer = data.correctAnswer
    this.solution = data.solution
    this.difficulty = data.difficulty
    this.solutionYoutubeUrl = data.solutionYoutubeUrl
    this.grade = data.grade
    this.subjectId = data.subjectId
    this.pointsOrigin = data.pointsOrigin
    this.metadata = data.metadata
    this.questionId = data.questionId
    this.session = data.session
    this.tempSection = data.tempSection
    this.subject = data.subject
    this.finalQuestion = data.finalQuestion
    this.tempStatements = data.tempStatements
  }

  /**
   * Kiểm tra có đáp án đúng không
   */
  hasCorrectAnswer(): boolean {
    return Boolean(this.correctAnswer && this.correctAnswer.trim().length > 0)
  }

  /**
   * Kiểm tra có lời giải không
   */
  hasSolution(): boolean {
    return Boolean(this.solution && this.solution.trim().length > 0)
  }

  /**
   * Kiểm tra có YouTube lời giải không
   */
  hasSolutionYoutube(): boolean {
    return Boolean(this.solutionYoutubeUrl && this.solutionYoutubeUrl.trim().length > 0)
  }

  /**
   * Kiểm tra có difficulty không
   */
  hasDifficulty(): boolean {
    return this.difficulty !== null && this.difficulty !== undefined
  }

  /**
   * Kiểm tra có grade không
   */
  hasGrade(): boolean {
    return this.grade !== null && this.grade !== undefined
  }

  /**
   * Kiểm tra có subject không
   */
  hasSubject(): boolean {
    return this.subjectId !== null && this.subjectId !== undefined
  }

  /**
   * Kiểm tra có points origin không
   */
  hasPointsOrigin(): boolean {
    return this.pointsOrigin !== null && this.pointsOrigin !== undefined
  }

  /**
   * Kiểm tra đã migrate sang bảng chính chưa
   */
  isMigrated(): boolean {
    return this.questionId !== null && this.questionId !== undefined
  }

  /**
   * Kiểm tra có statements không
   */
  hasStatements(): boolean {
    return Boolean(this.tempStatements && this.tempStatements.length > 0)
  }

  /**
   * Lấy số lượng statements
   */
  getStatementsCount(): number {
    return this.tempStatements?.length || 0
  }

  /**
   * Lấy type display
   */
  getTypeDisplay(): string {
    const typeMap = {
      [QuestionType.SINGLE_CHOICE]: 'Trắc nghiệm một đáp án',
      [QuestionType.MULTIPLE_CHOICE]: 'Trắc nghiệm nhiều đáp án',
      [QuestionType.FILL_IN_THE_BLANK]: 'Điền vào chỗ trống',
      [QuestionType.SHORT_ANSWER]: 'Trả lời ngắn',
      [QuestionType.ESSAY]: 'Tự luận',
    }
    return typeMap[this.type] || 'Không xác định'
  }

  /**
   * Lấy difficulty display
   */
  getDifficultyDisplay(): string {
    if (!this.difficulty) return 'Chưa xác định'
    const difficultyMap = {
      [Difficulty.TH]: 'Thông hiểu',
      [Difficulty.NB]: 'Nhận biết',
      [Difficulty.VD]: 'Vận dụng',
      [Difficulty.VDC]: 'Vận dụng cao',
    }
    return difficultyMap[this.difficulty] || 'Không xác định'
  }

  /**
   * Kiểm tra question có yêu cầu statements không
   */
  requiresStatements(): boolean {
    return (
      this.type === QuestionType.SINGLE_CHOICE || this.type === QuestionType.MULTIPLE_CHOICE
    )
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      tempQuestionId: this.tempQuestionId,
      sessionId: this.sessionId,
      tempSectionId: this.tempSectionId,
      content: this.content,
      type: this.type,
      correctAnswer: this.correctAnswer,
      solution: this.solution,
      difficulty: this.difficulty,
      solutionYoutubeUrl: this.solutionYoutubeUrl,
      grade: this.grade,
      subjectId: this.subjectId,
      pointsOrigin: this.pointsOrigin,
      order: this.order,
      metadata: this.metadata,
      questionId: this.questionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      hasCorrectAnswer: this.hasCorrectAnswer(),
      hasSolution: this.hasSolution(),
      hasSolutionYoutube: this.hasSolutionYoutube(),
      hasDifficulty: this.hasDifficulty(),
      hasGrade: this.hasGrade(),
      hasSubject: this.hasSubject(),
      hasPointsOrigin: this.hasPointsOrigin(),
      isMigrated: this.isMigrated(),
      hasStatements: this.hasStatements(),
      statementsCount: this.getStatementsCount(),
      typeDisplay: this.getTypeDisplay(),
      difficultyDisplay: this.getDifficultyDisplay(),
      requiresStatements: this.requiresStatements(),
      // Relations
      subject: this.subject ? this.subject.toJSON() : undefined,
      finalQuestion: this.finalQuestion ? this.finalQuestion.toJSON() : undefined,
    }
  }

  /**
   * Tạo entity từ Prisma model data
   */
  static fromPrisma(data: any): TempQuestion {
    return new TempQuestion({
      tempQuestionId: data.tempQuestionId,
      sessionId: data.sessionId,
      tempSectionId: data.tempSectionId,
      content: data.content,
      type: data.type as QuestionType,
      correctAnswer: data.correctAnswer,
      solution: data.solution,
      difficulty: data.difficulty as Difficulty,
      solutionYoutubeUrl: data.solutionYoutubeUrl,
      grade: data.grade,
      subjectId: data.subjectId,
      pointsOrigin: data.pointsOrigin,
      order: data.order,
      metadata: data.metadata,
      questionId: data.questionId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      session: data.session,
      tempSection: data.tempSection,
      subject: data.subject ? Subject.fromPrisma(data.subject) : undefined,
      finalQuestion: data.finalQuestion ? Question.fromPrisma(data.finalQuestion) : undefined,
      tempStatements: data.tempStatements
        ? data.tempStatements.map((s: any) => TempStatement.fromPrisma(s))
        : undefined,
    })
  }

  /**
   * So sánh hai entities
   */
  equals(other: TempQuestion): boolean {
    return this.tempQuestionId === other.tempQuestionId
  }
}

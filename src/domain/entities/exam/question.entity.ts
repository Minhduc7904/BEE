// src/domain/entities/exam/question.entity.ts

import { QuestionType } from '../../../shared/enums/question-type.enum'
import { Difficulty } from '../../../shared/enums/difficulty.enum'
import { Subject } from '../subject/subject.entity'
import { Statement } from './statement.entity'
import { QuestionExam } from './question-exam.entity'
import { QuestionChapter } from './question-chapter.entity'
import { Visibility } from 'src/shared/enums'

export class Question {
  // Required properties
  questionId: number
  content: string
  slug: string
  type: QuestionType
  difficulty: Difficulty | null
  grade: number | null
  visibility: Visibility
  createdAt: Date
  updatedAt: Date

  // Optional properties
  searchableContent?: string | null
  correctAnswer?: string | null
  solution?: string | null
  solutionYoutubeUrl?: string | null
  subjectId?: number | null
  pointsOrigin?: number | null
  createdBy?: number | null

  // Relations (optional - sẽ được populate khi cần)
  subject?: Subject | null
  admin?: any // AdminEntity
  statements?: Statement[]
  examQuestions?: QuestionExam[]
  questionChapters?: QuestionChapter[]

  constructor(data: {
    questionId: number
    content: string
    slug: string
    type: QuestionType
    difficulty: Difficulty | null
    grade: number | null
    createdAt: Date
    updatedAt: Date
    searchableContent?: string | null
    correctAnswer?: string | null
    solution?: string | null
    solutionYoutubeUrl?: string | null
    subjectId?: number | null
    pointsOrigin?: number | null
    createdBy?: number | null
    subject?: Subject | null
    admin?: any
    statements?: Statement[]
    examQuestions?: QuestionExam[]
    questionChapters?: QuestionChapter[]
    visibility: Visibility
  }) {
    this.questionId = data.questionId
    this.content = data.content
    this.slug = data.slug
    this.type = data.type
    this.difficulty = data.difficulty
    this.grade = data.grade
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.searchableContent = data.searchableContent
    this.correctAnswer = data.correctAnswer
    this.solution = data.solution
    this.solutionYoutubeUrl = data.solutionYoutubeUrl
    this.subjectId = data.subjectId
    this.pointsOrigin = data.pointsOrigin
    this.createdBy = data.createdBy
    this.subject = data.subject
    this.admin = data.admin
    this.statements = data.statements
    this.examQuestions = data.examQuestions
    this.questionChapters = data.questionChapters
    this.visibility = data.visibility
  }

  /**
   * Kiểm tra question có đáp án đúng không
   */
  hasCorrectAnswer(): boolean {
    return Boolean(this.correctAnswer && this.correctAnswer.trim().length > 0)
  }

  /**
   * Kiểm tra question có lời giải không
   */
  hasSolution(): boolean {
    return Boolean(this.solution && this.solution.trim().length > 0)
  }

  /**
   * Kiểm tra question có YouTube lời giải không
   */
  hasSolutionYoutube(): boolean {
    return Boolean(this.solutionYoutubeUrl && this.solutionYoutubeUrl.trim().length > 0)
  }

  /**
   * Kiểm tra question có được gán môn học không
   */
  hasSubject(): boolean {
    return this.subjectId !== null && this.subjectId !== undefined
  }

  /**
   * Kiểm tra question có điểm gốc không
   */
  hasPointsOrigin(): boolean {
    return this.pointsOrigin !== null && this.pointsOrigin !== undefined
  }

  /**
   * Kiểm tra question có statements không
   */
  hasStatements(): boolean {
    return Boolean(this.statements && this.statements.length > 0)
  }

  /**
   * Kiểm tra question có chapters không
   */
  hasChapters(): boolean {
    return Boolean(this.questionChapters && this.questionChapters.length > 0)
  }

  /**
   * Lấy nội dung hiển thị
   */
  getContentDisplay(): string {
    return this.content || 'Nội dung câu hỏi trống'
  }

  /**
   * Lấy đáp án đúng hiển thị
   */
  getCorrectAnswerDisplay(): string {
    return this.correctAnswer || 'Chưa có đáp án'
  }

  /**
   * Lấy lời giải hiển thị
   */
  getSolutionDisplay(): string {
    return this.solution || 'Chưa có lời giải'
  }

  /**
   * Lấy danh sách chapters
   */
  getChapters(): QuestionChapter[] {
    return this.questionChapters || []
  }

  /**
   * Lấy số lượng statements
   */
  getStatementsCount(): number {
    return this.statements?.length || 0
  }

  /**
   * Lấy statements đúng
   */
  getCorrectStatements(): Statement[] {
    if (!this.statements) return []
    return this.statements.filter((s) => s.isCorrect)
  }

  /**
   * Lấy thông tin môn học
   */
  getSubject(): Subject | null | undefined {
    return this.subject
  }

  /**
   * Lấy tên môn học
   */
  getSubjectName(): string {
    return this.subject?.name || 'Chưa xác định môn học'
  }

  /**
   * Lấy mã môn học
   */
  getSubjectCode(): string {
    return this.subject?.getSubjectCode() || 'N/A'
  }

  /**
   * Hiển thị thông tin môn học đầy đủ
   */
  getSubjectDisplay(): string {
    if (!this.subject) {
      return 'Chưa được gán môn học'
    }
    return this.subject.getFullName()
  }

  getTypeDisplay(): string {
    const typeMap = {
      [QuestionType.SINGLE_CHOICE]: 'Trắc nghiệm một đáp án',
      [QuestionType.MULTIPLE_CHOICE]: 'Trắc nghiệm nhiều đáp án',
      [QuestionType.SHORT_ANSWER]: 'Trả lời ngắn',
      [QuestionType.ESSAY]: 'Tự luận',
      [QuestionType.TRUE_FALSE]: 'Đúng/Sai',
    }
    return typeMap[this.type] || 'Không xác định'
  }

  getDifficultyDisplay(): string {
    if (!this.difficulty) return 'Chưa phân loại'
    
    const difficultyMap = {
      [Difficulty.TH]: 'Thông hiểu',
      [Difficulty.NB]: 'Nhận biết',
      [Difficulty.VD]: 'Vận dụng',
      [Difficulty.VDC]: 'Vận dụng cao',
    }
    return difficultyMap[this.difficulty] || 'Không xác định'
  }

  getGradeDisplay(): string {
    if (!this.grade) return 'Chưa phân loại'
    return `Lớp ${this.grade}`
  }

  // Type checking methods
  isSingleChoice(): boolean {
    return this.type === QuestionType.SINGLE_CHOICE
  }

  isMultipleChoice(): boolean {
    return this.type === QuestionType.MULTIPLE_CHOICE
  }

  isShortAnswer(): boolean {
    return this.type === QuestionType.SHORT_ANSWER
  }

  isEssay(): boolean {
    return this.type === QuestionType.ESSAY
  }

  // Difficulty checking methods
  isBasicLevel(): boolean {
    return this.difficulty === Difficulty.NB || this.difficulty === Difficulty.TH
  }

  isAdvancedLevel(): boolean {
    return this.difficulty === Difficulty.VD || this.difficulty === Difficulty.VDC
  }

  /**
   * Lấy tiêu đề đầy đủ của question
   */
  getFullTitle(): string {
    const subject = this.getSubjectName()
    const parts = [subject]
    parts.push(`Lớp ${this.grade}`)
    return parts.join(' - ')
  }

  /**
   * Kiểm tra question có dành cho lớp cụ thể không
   */
  isForGrade(grade: number): boolean {
    return this.grade === grade
  }

  /**
   * Kiểm tra question có thuộc môn học cụ thể không (theo ID)
   */
  belongsToSubject(subjectId: number): boolean {
    return this.subjectId === subjectId
  }

  /**
   * Kiểm tra question có thuộc môn học cụ thể không (theo tên)
   */
  isForSubjectName(subjectName: string): boolean {
    if (!this.subject) return false
    return this.subject.name.toLowerCase().includes(subjectName.toLowerCase())
  }

  /**
   * Kiểm tra question có được tạo bởi admin cụ thể không
   */
  isCreatedBy(adminId: number): boolean {
    return this.createdBy === adminId
  }

  /**
   * Kiểm tra question có đầy đủ thông tin cần thiết không
   */
  isComplete(): boolean {
    return Boolean(this.content && this.content.trim()) && this.hasCorrectAnswer()
  }

  /**
   * Kiểm tra question có thể sử dụng trong exam không
   */
  canBeUsedInExam(): boolean {
    return (
      this.isComplete() &&
      (this.isSingleChoice() || this.isMultipleChoice() || this.hasCorrectAnswer()) &&
      this.hasSubject()
    )
  }

  /**
   * Kiểm tra question có yêu cầu statements không (trắc nghiệm)
   */
  requiresStatements(): boolean {
    return this.isSingleChoice() || this.isMultipleChoice()
  }

  /**
   * Kiểm tra question có đầy đủ lời giải không
   */
  hasCompleteSolution(): boolean {
    return this.hasSolution() || this.hasSolutionYoutube()
  }

  /**
   * Lấy admin tạo question
   */
  getAdmin(): any | undefined {
    return this.admin
  }

  /**
   * Kiểm tra question có được tạo sau ngày cụ thể không
   */
  isCreatedAfter(date: Date): boolean {
    return this.createdAt > date
  }

  /**
   * Kiểm tra question có được cập nhật gần đây không
   */
  wasUpdatedRecently(daysAgo: number = 7): boolean {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysAgo)
    return this.updatedAt > threshold
  }

  /**
   * Lấy điểm số đề xuất cho question dựa trên độ khó
   */
  getSuggestedScore(): number {
    switch (this.difficulty) {
      case Difficulty.NB:
        return 0.5
      case Difficulty.TH:
        return 1.0
      case Difficulty.VD:
        return 1.5
      case Difficulty.VDC:
        return 2.0
      default:
        return 1.0
    }
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      questionId: this.questionId,
      content: this.content,
      type: this.type,
      difficulty: this.difficulty,
      grade: this.grade,
      subjectId: this.subjectId,
      pointsOrigin: this.pointsOrigin,
      correctAnswer: this.correctAnswer,
      solution: this.solution,
      solutionYoutubeUrl: this.solutionYoutubeUrl,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      hasCorrectAnswer: this.hasCorrectAnswer(),
      hasSolution: this.hasSolution(),
      hasSubject: this.hasSubject(),
      hasPointsOrigin: this.hasPointsOrigin(),
      hasStatements: this.hasStatements(),
      hasChapters: this.hasChapters(),
      hasSolutionYoutube: this.hasSolutionYoutube(),
      subjectName: this.getSubjectName(),
      subjectCode: this.getSubjectCode(),
      subjectDisplay: this.getSubjectDisplay(),
      typeDisplay: this.getTypeDisplay(),
      difficultyDisplay: this.getDifficultyDisplay(),
      gradeDisplay: this.getGradeDisplay(),
      fullTitle: this.getFullTitle(),
      isComplete: this.isComplete(),
      canBeUsedInExam: this.canBeUsedInExam(),
      requiresStatements: this.requiresStatements(),
      hasCompleteSolution: this.hasCompleteSolution(),
      suggestedScore: this.getSuggestedScore(),
      isBasicLevel: this.isBasicLevel(),
      isAdvancedLevel: this.isAdvancedLevel(),
      wasUpdatedRecently: this.wasUpdatedRecently(),
      statementsCount: this.getStatementsCount(),
      // Relations
      subject: this.subject ? this.subject.toJSON() : undefined,
      admin: this.admin
        ? {
            adminId: this.admin.adminId,
            userId: this.admin.userId,
            fullName: this.admin.getFullName ? this.admin.getFullName() : undefined,
          }
        : undefined,
    }
  }

  /**
   * Tạo entity từ Prisma model data
   */
  static fromPrisma(data: any): Question {
    return new Question({
      questionId: data.questionId,
      content: data.content,
      slug: data.slug || `question-${data.questionId}`,
      type: data.type,
      difficulty: data.difficulty,
      grade: data.grade,
      subjectId: data.subjectId,
      pointsOrigin: data.pointsOrigin,
      searchableContent: data.searchableContent,
      correctAnswer: data.correctAnswer,
      solution: data.solution,
      solutionYoutubeUrl: data.solutionYoutubeUrl,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      subject: data.subject ? Subject.fromPrisma(data.subject) : undefined,
      admin: data.admin,
      statements: data.statements,
      examQuestions: data.examQuestions,
      questionChapters: data.questionChapters,
      visibility: data.visibility,
    })
  }

  /**
   * Tạo question cơ bản
   */
  static createBasic(
    questionId: number,
    content: string,
    type: QuestionType,
    difficulty: Difficulty,
    grade: number,
    createdBy?: number,
  ): Question {
    const now = new Date()
    return new Question({
      questionId,
      content,
      slug: `question-${questionId}`,
      type,
      difficulty,
      grade,
      createdAt: now,
      updatedAt: now,
      createdBy,
      visibility: Visibility.DRAFT,
    })
  }

  /**
   * So sánh hai question entities
   */
  equals(other: Question): boolean {
    return this.questionId === other.questionId
  }
}

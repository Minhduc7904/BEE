// src/domain/entities/exam/exam.entity.ts
import { Subject } from '../subject/subject.entity'
import { QuestionExam } from './question-exam.entity'
import { Competition } from './competition.entity'
import { Visibility } from 'src/shared/enums'

export class Exam {
  // Required properties
  examId: number
  title: string
  grade: number
  createdBy: number
  visibility: Visibility
  createdAt: Date
  updatedAt: Date

  // Optional properties
  description?: string | null
  subjectId?: number | null

  // Relations (optional - sẽ được populate khi cần)
  subject?: Subject | null
  admin?: any // AdminEntity
  competitions?: Competition[] // Competition[]
  questions?: QuestionExam[] // QuestionExam[]

  constructor(data: {
    examId: number
    title: string
    grade: number
    createdBy: number
    visibility: Visibility
    createdAt: Date
    updatedAt: Date
    description?: string | null
    subjectId?: number | null
    subject?: Subject | null
    admin?: any
    competitions?: Competition[]
    questions?: QuestionExam[]
  }) {
    this.examId = data.examId
    this.title = data.title
    this.grade = data.grade
    this.createdBy = data.createdBy
    this.visibility = data.visibility
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.description = data.description
    this.subjectId = data.subjectId
    this.subject = data.subject
    this.admin = data.admin
    this.competitions = data.competitions
    this.questions = data.questions
  }

  /**
   * Kiểm tra exam có mô tả không
   */
  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0)
  }

  /**
   * Kiểm tra exam đã được xuất bản chưa
   */
  isPublished(): boolean {
    return this.visibility === Visibility.PUBLISHED
  }

  /**
   * Kiểm tra exam đang ở trạng thái draft
   */
  isDraft(): boolean {
    return this.visibility === Visibility.DRAFT
  }

  /**
   * Kiểm tra exam ở trạng thái private
   */
  isPrivate(): boolean {
    return this.visibility === Visibility.PRIVATE
  }

  /**
   * Lấy trạng thái hiển thị
   */
  getVisibilityDisplay(): string {
    const visibilityMap = {
      [Visibility.DRAFT]: 'Bản nháp',
      [Visibility.PRIVATE]: 'Riêng tư',
      [Visibility.PUBLISHED]: 'Đã xuất bản'
    }
    return visibilityMap[this.visibility] || 'Không xác định'
  }

  /**
   * Kiểm tra exam có được gán môn học không
   */
  hasSubject(): boolean {
    return this.subjectId !== null && this.subjectId !== undefined
  }

  /**
   * Kiểm tra exam có câu hỏi không
   */
  hasQuestions(): boolean {
    return Boolean(this.questions && this.questions.length > 0)
  }

  /**
   * Lấy số lượng câu hỏi
   */
  getQuestionsCount(): number {
    return this.questions?.length || 0
  }

  /**
   * Kiểm tra exam có competitions không
   */
  hasCompetitions(): boolean {
    return Boolean(this.competitions && this.competitions.length > 0)
  }

  /**
   * Lấy tiêu đề hiển thị
   */
  getTitleDisplay(): string {
    return this.title || 'Chưa có tiêu đề'
  }

  /**
   * Lấy mô tả hiển thị
   */
  getDescriptionDisplay(): string {
    return this.description || 'Không có mô tả'
  }

  /**
   * Lấy thông tin môn học
   */
  getSubject(): Subject | undefined {
    return this.subject ? this.subject : undefined
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

  /**
   * Lấy thông tin lớp hiển thị
   */
  getGradeDisplay(): string {
    return `Lớp ${this.grade}`
  }

  /**
   * Lấy thông tin đầy đủ về exam
   */
  getFullTitle(): string {
    const subjectName = this.getSubjectName()
    return `${this.title} - ${subjectName} - ${this.getGradeDisplay()}`
  }

  /**
   * Kiểm tra exam có dành cho lớp cụ thể không
   */
  isForGrade(grade: number): boolean {
    return this.grade === grade
  }

  /**
   * Kiểm tra exam có thuộc môn học cụ thể không (theo ID)
   */
  belongsToSubject(subjectId: number): boolean {
    return this.subjectId === subjectId
  }

  /**
   * Kiểm tra exam có thuộc môn học cụ thể không (theo tên)
   */
  isForSubjectName(subjectName: string): boolean {
    if (!this.subject) return false
    return this.subject.name.toLowerCase().includes(subjectName.toLowerCase())
  }

  /**
   * Kiểm tra exam có được tạo bởi admin cụ thể không
   */
  isCreatedBy(adminId: number): boolean {
    return this.createdBy === adminId
  }

  /**
   * Kiểm tra exam có đầy đủ thông tin cần thiết không
   */
  isComplete(): boolean {
    return Boolean(this.title && this.title.trim()) && this.hasQuestions()
  }

  /**
   * Kiểm tra exam có thể sử dụng trong thi đấu không
   */
  canBeUsedInCompetition(): boolean {
    return this.isComplete() && this.hasSubject()
  }

  /**
   * Tính tổng điểm của đề thi
   */
  getTotalPoints(): number {
    if (!this.questions) return 0
    return this.questions.reduce((total, qe) => {
      return total + (qe.points || 0)
    }, 0)
  }

  /**
   * Lấy độ khó của exam (dựa trên lớp)
   */
  getDifficultyLevel(): string {
    if (this.grade <= 6) return 'Cơ bản'
    if (this.grade <= 9) return 'Trung bình'
    if (this.grade <= 12) return 'Nâng cao'
    return 'Không xác định'
  }

  /**
   * Kiểm tra exam có được tạo sau ngày cụ thể không
   */
  isCreatedAfter(date: Date): boolean {
    return this.createdAt > date
  }

  /**
   * Kiểm tra exam có được cập nhật gần đây không
   */
  wasUpdatedRecently(daysAgo: number = 7): boolean {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysAgo)
    return this.updatedAt > threshold
  }

  /**
   * Lấy admin tạo exam
   */
  getAdmin(): any | undefined {
    return this.admin
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      examId: this.examId,
      title: this.title,
      grade: this.grade,
      subjectId: this.subjectId,
      createdBy: this.createdBy,
      description: this.description,
      visibility: this.visibility,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      hasDescription: this.hasDescription(),
      hasSubject: this.hasSubject(),
      isPublished: this.isPublished(),
      isDraft: this.isDraft(),
      isPrivate: this.isPrivate(),
      visibilityDisplay: this.getVisibilityDisplay(),
      subjectName: this.getSubjectName(),
      subjectCode: this.getSubjectCode(),
      subjectDisplay: this.getSubjectDisplay(),
      gradeDisplay: this.getGradeDisplay(),
      fullTitle: this.getFullTitle(),
      isComplete: this.isComplete(),
      canBeUsedInCompetition: this.canBeUsedInCompetition(),
      difficultyLevel: this.getDifficultyLevel(),
      wasUpdatedRecently: this.wasUpdatedRecently(),
      totalPoints: this.getTotalPoints(),
      questionsCount: this.getQuestionsCount(),
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
  static fromPrisma(data: any): Exam {
    return new Exam({
      examId: data.examId,
      title: data.title,
      grade: data.grade,
      subjectId: data.subjectId,
      createdBy: data.createdBy,
      visibility: data.visibility as Visibility,
      description: data.description,
      competitions: data.competitions,
      questions: data.questions
        ? data.questions.map((qe: any) => QuestionExam.fromPrisma(qe))
        : undefined,

      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      subject: data.subject ? Subject.fromPrisma(data.subject) : undefined,
      admin: data.admin,
    })
  }

  /**
   * Tạo exam cơ bản
   */
  static createBasic(examId: number, title: string, grade: number, subjectId: number, createdBy: number, visibility: Visibility = Visibility.DRAFT): Exam {
    const now = new Date()
    return new Exam({
      examId,
      title,
      grade,
      subjectId,
      createdBy,
      visibility,
      createdAt: now,
      updatedAt: now,
    })
  }

  /**
   * So sánh hai exam entities
   */
  equals(other: Exam): boolean {
    return this.examId === other.examId
  }
}

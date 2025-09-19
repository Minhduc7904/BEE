// src/domain/entities/subject/subject.entity.ts
import { ChapterEntity } from '../chapter/chapter.entity'
import { Admin } from '../user/admin.entity'
import { Document } from '../document/document.entity'
import { Exam } from '../exam/exam.entity'
import { Question } from '../exam/question.entity'

export class SubjectEntity {
  subjectId: number
  name: string
  code?: string | null

  // Relations (optional - sẽ được populate khi cần)
  chapters?: ChapterEntity[] // ChapterEntity[] - avoid circular dependency
  admins?: Admin[] // AdminEntity[]
  documents?: Document[] // DocumentEntity[]
  exams?: Exam[] // ExamEntity[]
  questions?: Question[] // QuestionEntity[]
  courses?: any[] // CourseEntity[]

  constructor(data: {
    subjectId: number
    name: string
    code?: string | null
    chapters?: ChapterEntity[]
    admins?: Admin[]
    documents?: any[]
    exams?: Exam[]
    questions?: Question[]
    courses?: any[]
  }) {
    this.subjectId = data.subjectId
    this.name = data.name
    this.code = data.code
    this.chapters = data.chapters
    this.admins = data.admins
    this.documents = data.documents
    this.exams = data.exams
    this.questions = data.questions
    this.courses = data.courses
  }

  /**
   * Lấy mã môn học hoặc tạo từ tên nếu không có
   */
  getSubjectCode(): string {
    if (this.code) {
      return this.code
    }

    // Tạo code từ tên môn học
    return this.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10)
  }

  /**
   * Lấy tên đầy đủ với mã môn học
   */
  getFullName(): string {
    const code = this.getSubjectCode()
    return `${code} - ${this.name}`
  }

  /**
   * Kiểm tra xem môn học có chapters không
   */
  hasChapters(): boolean {
    return Boolean(this.chapters && this.chapters.length > 0)
  }

  /**
   * Lấy số lượng chapters
   */
  getChaptersCount(): number {
    return this.chapters ? this.chapters.length : 0
  }

  /**
   * Lấy chapters theo level (0 = root chapters)
   */
  getChaptersByLevel(level: number): any[] {
    if (!this.chapters) return []
    return this.chapters.filter((chapter) => chapter.level === level)
  }

  /**
   * Lấy tất cả root chapters (level 0)
   */
  getRootChapters(): any[] {
    return this.getChaptersByLevel(0)
  }

  /**
   * Lấy số lượng courses của môn học
   */
  getCoursesCount(): number {
    return this.courses ? this.courses.length : 0
  }

  /**
   * Lấy số lượng exams của môn học
   */
  getExamsCount(): number {
    return this.exams ? this.exams.length : 0
  }

  /**
   * Lấy số lượng questions của môn học
   */
  getQuestionsCount(): number {
    return this.questions ? this.questions.length : 0
  }

  /**
   * Kiểm tra xem có phải môn học chính (có nhiều nội dung) không
   */
  isMajorSubject(): boolean {
    const totalContent = this.getChaptersCount() + this.getCoursesCount() + this.getExamsCount()
    return totalContent > 10 // Threshold có thể điều chỉnh
  }

  /**
   * Lấy thống kê tổng quan về môn học
   */
  getStatistics() {
    return {
      subjectId: this.subjectId,
      name: this.name,
      code: this.getSubjectCode(),
      chaptersCount: this.getChaptersCount(),
      rootChaptersCount: this.getRootChapters().length,
      coursesCount: this.getCoursesCount(),
      examsCount: this.getExamsCount(),
      questionsCount: this.getQuestionsCount(),
      isMajorSubject: this.isMajorSubject(),
    }
  }

  /**
   * Tìm chapter theo slug
   */
  findChapterBySlug(slug: string): any | null {
    if (!this.chapters) return null
    return this.chapters.find((chapter) => chapter.slug === slug) || null
  }

  /**
   * Tìm chapters theo pattern (ví dụ: "10c" để tìm tất cả chapters lớp 10)
   */
  findChaptersByPattern(pattern: string): any[] {
    if (!this.chapters) return []
    const regex = new RegExp(pattern, 'i')
    return this.chapters.filter((chapter) => regex.test(chapter.slug) || regex.test(chapter.name))
  }

  /**
   * Lấy chapters theo grade (từ slug pattern)
   */
  getChaptersByGrade(grade: number): any[] {
    return this.findChaptersByPattern(`^${grade}c`)
  }

  /**
   * Serialize để gửi qua API
   */
  toJSON() {
    return {
      subjectId: this.subjectId,
      name: this.name,
      code: this.code,
      subjectCode: this.getSubjectCode(),
      fullName: this.getFullName(),
      hasChapters: this.hasChapters(),
      chaptersCount: this.getChaptersCount(),
      coursesCount: this.getCoursesCount(),
      examsCount: this.getExamsCount(),
      questionsCount: this.getQuestionsCount(),
      isMajorSubject: this.isMajorSubject(),
    }
  }

  /**
   * Serialize với chapters để gửi qua API
   */
  toJSONWithChapters() {
    return {
      ...this.toJSON(),
      chapters: this.chapters
        ? this.chapters.map((chapter) => (typeof chapter.toJSON === 'function' ? chapter.toJSON() : chapter))
        : [],
      rootChapters: this.getRootChapters().map((chapter) =>
        typeof chapter.toJSON === 'function' ? chapter.toJSON() : chapter,
      ),
    }
  }

  /**
   * Tạo entity từ Prisma model data
   */
  static fromPrisma(data: any): SubjectEntity {
    return new SubjectEntity({
      subjectId: data.subjectId,
      name: data.name,
      code: data.code,
      chapters: data.chapters ? data.chapters.map((chapter: any) => ChapterEntity.fromPrisma(chapter)) : undefined,
      admins: data.admins ? data.admins.map((admin: any) => Admin.fromPrisma(admin)) : undefined,
      documents: data.documents,
      exams: data.exams,
      questions: data.questions,
      courses: data.courses,
    })
  }

  /**
   * Tạo subject cơ bản (chỉ có thông tin chính)
   */
  static createBasic(subjectId: number, name: string, code?: string): SubjectEntity {
    return new SubjectEntity({
      subjectId,
      name,
      code,
    })
  }

  /**
   * So sánh hai subjects
   */
  equals(other: SubjectEntity): boolean {
    return this.subjectId === other.subjectId
  }

  /**
   * Tạo slug từ tên môn học
   */
  generateSlug(): string {
    return this.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

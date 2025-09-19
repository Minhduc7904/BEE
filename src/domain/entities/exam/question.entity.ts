// src/domain/entities/exam/question.entity.ts

import { QuestionType } from '../../../shared/enums/question-type.enum'
import { Difficulty } from '../../../shared/enums/difficulty.enum'
import { SubjectEntity } from '../subject/subject.entity'
import { ChapterEntity } from '../chapter/chapter.entity'

export class Question {
  // Required properties
  questionId: number
  content: string
  type: QuestionType
  difficulty: Difficulty
  grade: number
  createdAt: Date
  updatedAt: Date

  // Optional properties
  imageId?: number
  correctAnswer?: string
  solution?: string
  subjectId?: number | null
  chapterId?: number | null
  solutionYoutubeUrl?: string
  solutionImageId?: number
  createdBy?: number

  // Relations (optional - sẽ được populate khi cần)
  subject?: SubjectEntity
  chapter?: ChapterEntity
  admin?: any // AdminEntity
  image?: any // ImageEntity
  solutionImage?: any // ImageEntity

  constructor(data: {
    questionId: number
    content: string
    type: QuestionType
    difficulty: Difficulty
    grade: number
    createdAt: Date
    updatedAt: Date
    imageId?: number
    correctAnswer?: string
    solution?: string
    subjectId?: number | null
    chapterId?: number | null
    solutionYoutubeUrl?: string
    solutionImageId?: number
    createdBy?: number
    subject?: SubjectEntity
    chapter?: ChapterEntity
    admin?: any
    image?: any
    solutionImage?: any
  }) {
    this.questionId = data.questionId
    this.content = data.content
    this.type = data.type
    this.difficulty = data.difficulty
    this.grade = data.grade
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.imageId = data.imageId
    this.correctAnswer = data.correctAnswer
    this.solution = data.solution
    this.subjectId = data.subjectId
    this.chapterId = data.chapterId
    this.solutionYoutubeUrl = data.solutionYoutubeUrl
    this.solutionImageId = data.solutionImageId
    this.createdBy = data.createdBy
    this.subject = data.subject
    this.chapter = data.chapter
    this.admin = data.admin
    this.image = data.image
    this.solutionImage = data.solutionImage
  }

  /**
   * Kiểm tra question có hình ảnh không
   */
  hasImage(): boolean {
    return !!this.imageId
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
   * Kiểm tra question có được gán chương không
   */
  hasChapter(): boolean {
    return !!this.chapterId
  }

  /**
   * Kiểm tra question có YouTube lời giải không
   */
  hasSolutionYoutube(): boolean {
    return Boolean(this.solutionYoutubeUrl && this.solutionYoutubeUrl.trim().length > 0)
  }

  /**
   * Kiểm tra question có hình ảnh lời giải không
   */
  hasSolutionImage(): boolean {
    return !!this.solutionImageId
  }

  /**
   * Kiểm tra question có được gán môn học không
   */
  hasSubject(): boolean {
    return !!this.subjectId
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
   * Lấy thông tin chương
   */
  getChapter(): ChapterEntity | undefined {
    return this.chapter
  }

  /**
   * Lấy tên chương
   */
  getChapterName(): string {
    return this.chapter?.name || 'Chưa xác định chương'
  }

  /**
   * Lấy slug chương
   */
  getChapterSlug(): string {
    return this.chapter?.slug || 'N/A'
  }

  /**
   * Hiển thị thông tin chương đầy đủ
   */
  getChapterDisplay(): string {
    if (!this.chapter) {
      return 'Chưa được gán chương'
    }
    return this.chapter.getFullPath()
  }

  /**
   * Lấy thông tin môn học
   */
  getSubject(): SubjectEntity | undefined {
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
      [QuestionType.FILL_IN_THE_BLANK]: 'Điền vào chỗ trống',
      [QuestionType.SHORT_ANSWER]: 'Trả lời ngắn',
      [QuestionType.ESSAY]: 'Tự luận',
    }
    return typeMap[this.type] || 'Không xác định'
  }

  getDifficultyDisplay(): string {
    const difficultyMap = {
      [Difficulty.TH]: 'Thông hiểu',
      [Difficulty.NB]: 'Nhận biết',
      [Difficulty.VD]: 'Vận dụng',
      [Difficulty.VDC]: 'Vận dụng cao',
    }
    return difficultyMap[this.difficulty] || 'Không xác định'
  }

  getGradeDisplay(): string {
    return `Lớp ${this.grade}`
  }

  // Type checking methods
  isSingleChoice(): boolean {
    return this.type === QuestionType.SINGLE_CHOICE
  }

  isMultipleChoice(): boolean {
    return this.type === QuestionType.MULTIPLE_CHOICE
  }

  isFillInTheBlank(): boolean {
    return this.type === QuestionType.FILL_IN_THE_BLANK
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
    const chapter = this.getChapterName()
    const parts = [subject]
    if (chapter !== 'Chưa xác định chương') {
      parts.push(chapter)
    }
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
   * Kiểm tra question có thuộc chương cụ thể không (theo ID)
   */
  belongsToChapter(chapterId: number): boolean {
    return this.chapterId === chapterId
  }

  /**
   * Kiểm tra question có thuộc môn học cụ thể không (theo tên)
   */
  isForSubjectName(subjectName: string): boolean {
    if (!this.subject) return false
    return this.subject.name.toLowerCase().includes(subjectName.toLowerCase())
  }

  /**
   * Kiểm tra question có thuộc chương cụ thể không (theo tên)
   */
  isForChapterName(chapterName: string): boolean {
    if (!this.chapter) return false
    return this.chapter.name.toLowerCase().includes(chapterName.toLowerCase())
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
    return this.hasSolution() || this.hasSolutionYoutube() || this.hasSolutionImage()
  }

  /**
   * Lấy admin tạo question
   */
  getAdmin(): any | undefined {
    return this.admin
  }

  /**
   * Lấy hình ảnh của question
   */
  getImage(): any | undefined {
    return this.image
  }

  /**
   * Lấy hình ảnh lời giải
   */
  getSolutionImage(): any | undefined {
    return this.solutionImage
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
      chapterId: this.chapterId,
      imageId: this.imageId,
      correctAnswer: this.correctAnswer,
      solution: this.solution,
      solutionYoutubeUrl: this.solutionYoutubeUrl,
      solutionImageId: this.solutionImageId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed fields
      hasImage: this.hasImage(),
      hasCorrectAnswer: this.hasCorrectAnswer(),
      hasSolution: this.hasSolution(),
      hasSubject: this.hasSubject(),
      hasChapter: this.hasChapter(),
      hasSolutionYoutube: this.hasSolutionYoutube(),
      hasSolutionImage: this.hasSolutionImage(),
      subjectName: this.getSubjectName(),
      subjectCode: this.getSubjectCode(),
      subjectDisplay: this.getSubjectDisplay(),
      chapterName: this.getChapterName(),
      chapterSlug: this.getChapterSlug(),
      chapterDisplay: this.getChapterDisplay(),
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
      // Relations
      subject: this.subject ? this.subject.toJSON() : undefined,
      chapter: this.chapter ? this.chapter.toJSON() : undefined,
      admin: this.admin
        ? {
            adminId: this.admin.adminId,
            userId: this.admin.userId,
            fullName: this.admin.getFullName ? this.admin.getFullName() : undefined,
          }
        : undefined,
      image: this.image
        ? {
            imageId: this.image.imageId,
            url: this.image.url,
          }
        : undefined,
      solutionImage: this.solutionImage
        ? {
            imageId: this.solutionImage.imageId,
            url: this.solutionImage.url,
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
      type: data.type,
      difficulty: data.difficulty,
      grade: data.grade,
      subjectId: data.subjectId,
      chapterId: data.chapterId,
      imageId: data.imageId,
      correctAnswer: data.correctAnswer,
      solution: data.solution,
      solutionYoutubeUrl: data.solutionYoutubeUrl,
      solutionImageId: data.solutionImageId,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      subject: data.subject ? SubjectEntity.fromPrisma(data.subject) : undefined,
      chapter: data.chapter ? ChapterEntity.fromPrisma(data.chapter) : undefined,
      admin: data.admin,
      image: data.image,
      solutionImage: data.solutionImage,
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
      type,
      difficulty,
      grade,
      createdAt: now,
      updatedAt: now,
      createdBy,
    })
  }

  /**
   * So sánh hai question entities
   */
  equals(other: Question): boolean {
    return this.questionId === other.questionId
  }
}

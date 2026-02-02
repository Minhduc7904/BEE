// src/domain/entities/exam-import/temp-question-chapter.entity.ts

import { TempQuestion } from './temp-question.entity'
import { Chapter } from '../chapter/chapter.entity'

export class TempQuestionChapter {
  // Required properties
  tempQuestionId: number
  chapterId: number

  // Relations (optional - sẽ được populate khi cần)
  tempQuestion?: TempQuestion
  chapter?: Chapter

  constructor(data: {
    tempQuestionId: number
    chapterId: number
    tempQuestion?: TempQuestion
    chapter?: Chapter
  }) {
    this.tempQuestionId = data.tempQuestionId
    this.chapterId = data.chapterId
    this.tempQuestion = data.tempQuestion
    this.chapter = data.chapter
  }

  /**
   * Kiểm tra câu hỏi tạm có thuộc chương cụ thể không
   */
  belongsToChapter(chapterId: number): boolean {
    return this.chapterId === chapterId
  }

  /**
   * Kiểm tra có phải câu hỏi tạm cụ thể không
   */
  isTempQuestion(tempQuestionId: number): boolean {
    return this.tempQuestionId === tempQuestionId
  }

  /**
   * Kiểm tra có thông tin tempQuestion được load không
   */
  hasTempQuestionLoaded(): boolean {
    return !!this.tempQuestion
  }

  /**
   * Kiểm tra có thông tin chapter được load không
   */
  hasChapterLoaded(): boolean {
    return !!this.chapter
  }

  /**
   * Lấy tên chương
   */
  getChapterName(): string {
    return this.chapter?.name || 'Chưa xác định chương'
  }

  /**
   * Lấy đường dẫn đầy đủ của chương
   */
  getChapterFullPath(): string {
    return this.chapter?.getFullPath() || 'N/A'
  }

  /**
   * Lấy nội dung câu hỏi tạm (rút gọn)
   */
  getTempQuestionPreview(): string {
    if (!this.tempQuestion) return 'N/A'
    const content = this.tempQuestion.content || ''
    return content.length > 50 ? `${content.substring(0, 50)}...` : content
  }

  /**
   * Lấy thông tin hiển thị đầy đủ
   */
  getFullDisplay(): string {
    const chapterName = this.getChapterName()
    const questionPreview = this.getTempQuestionPreview()
    return `${questionPreview} (${chapterName})`
  }

  /**
   * Kiểm tra tính hợp lệ của quan hệ
   */
  isValid(): boolean {
    return this.tempQuestionId > 0 && this.chapterId > 0
  }

  /**
   * Lấy slug của chương
   */
  getChapterSlug(): string {
    return this.chapter?.slug || ''
  }
}

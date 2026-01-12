// src/domain/entities/exam/question-chapter.entity.ts

import { Question } from './question.entity'
import { Chapter } from '../chapter/chapter.entity'

export class QuestionChapter {
  // Required properties
  questionId: number
  chapterId: number

  // Relations (optional - sẽ được populate khi cần)
  question?: Question
  chapter?: Chapter

  constructor(data: { questionId: number; chapterId: number; question?: Question; chapter?: Chapter }) {
    this.questionId = data.questionId
    this.chapterId = data.chapterId
    this.question = data.question
    this.chapter = data.chapter
  }

  /**
   * Kiểm tra câu hỏi có thuộc chương cụ thể không
   */
  belongsToChapter(chapterId: number): boolean {
    return this.chapterId === chapterId
  }

  /**
   * Kiểm tra có phải câu hỏi cụ thể không
   */
  isQuestion(questionId: number): boolean {
    return this.questionId === questionId
  }

  /**
   * Kiểm tra có thông tin question được load không
   */
  hasQuestionLoaded(): boolean {
    return !!this.question
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
   * Lấy nội dung câu hỏi (rút gọn)
   */
  getQuestionPreview(): string {
    if (!this.question) return 'N/A'
    const content = this.question.content || ''
    return content.length > 50 ? `${content.substring(0, 50)}...` : content
  }

  /**
   * Lấy thông tin hiển thị đầy đủ
   */
  getFullDisplay(): string {
    const chapterName = this.getChapterName()
    const questionPreview = this.getQuestionPreview()
    return `${questionPreview} (${chapterName})`
  }

  /**
   * Kiểm tra câu hỏi có thuộc môn học cụ thể không (thông qua chapter)
   */
  belongsToSubject(subjectId: number): boolean {
    return this.chapter?.subjectId === subjectId
  }

  /**
   * Lấy level của chương
   */
  getChapterLevel(): number {
    return this.chapter?.level || 0
  }

  /**
   * Kiểm tra có phải chương gốc (root) không
   */
  isRootChapter(): boolean {
    return this.chapter?.isRoot() || false
  }
}

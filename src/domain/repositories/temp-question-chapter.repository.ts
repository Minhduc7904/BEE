// src/domain/repositories/temp-question-chapter.repository.ts
import { TempQuestionChapter } from '../entities/exam-import/temp-question-chapter.entity'

export interface CreateTempQuestionChapterData {
  tempQuestionId: number
  chapterId: number
}

export interface ITempQuestionChapterRepository {
  /**
   * Tạo một TempQuestionChapter
   */
  create(data: CreateTempQuestionChapterData): Promise<TempQuestionChapter>

  /**
   * Tạo nhiều TempQuestionChapter cùng lúc
   */
  createMany(data: CreateTempQuestionChapterData[]): Promise<number>

  /**
   * Tìm tất cả chapters của một temp question
   */
  findByTempQuestionId(tempQuestionId: number): Promise<TempQuestionChapter[]>

  /**
   * Xóa tất cả chapters của một temp question
   */
  deleteByTempQuestionId(tempQuestionId: number): Promise<number>

  /**
   * Xóa một TempQuestionChapter cụ thể
   */
  delete(tempQuestionId: number, chapterId: number): Promise<boolean>
}

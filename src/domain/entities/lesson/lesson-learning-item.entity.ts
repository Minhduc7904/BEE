// src/domain/entities/lesson/lesson-learning-item.entity.ts
import { Lesson } from './lesson.entity'
import { LearningItem } from '../learningItem/learning-item.entity'

export class LessonLearningItem {
  // Required properties
  lessonId: number
  learningItemId: number
  createdAt: Date

  // Optional properties
  order?: number | null

  // Relations (optional - sẽ được populate khi cần)
  lesson?: Lesson
  learningItem?: LearningItem

  constructor(data: {
    lessonId: number
    learningItemId: number
    createdAt: Date
    order?: number | null
    lesson?: Lesson
    learningItem?: LearningItem
  }) {
    this.lessonId = data.lessonId
    this.learningItemId = data.learningItemId
    this.createdAt = data.createdAt
    this.order = data.order
    this.lesson = data.lesson
    this.learningItem = data.learningItem
  }

  /**
   * Kiểm tra có order không
   */
  hasOrder(): boolean {
    return this.order !== null && this.order !== undefined
  }

  /**
   * Lấy order hiển thị (1-indexed)
   */
  getDisplayOrder(): string {
    return this.order !== null && this.order !== undefined ? `#${this.order}` : 'N/A'
  }

  /**
   * Lấy lesson title (nếu có)
   */
  getLessonTitle(): string | null {
    return this.lesson?.title ?? null
  }

  /**
   * Lấy learning item title (nếu có)
   */
  getLearningItemTitle(): string | null {
    return this.learningItem?.title ?? null
  }

  /**
   * Lấy learning item type (nếu có)
   */
  getLearningItemType(): string | null {
    return this.learningItem?.type ?? null
  }

  /**
   * Tạo plain object từ entity
   */
  toJSON() {
    return {
      lessonId: this.lessonId,
      learningItemId: this.learningItemId,
      order: this.order,
      createdAt: this.createdAt,
      lesson: this.lesson,
      learningItem: this.learningItem,
    }
  }

  /**
   * So sánh 2 lesson-learning-items theo composite key
   */
  equals(other: LessonLearningItem): boolean {
    return this.lessonId === other.lessonId && this.learningItemId === other.learningItemId
  }

  /**
   * Clone lesson learning item entity
   */
  clone(): LessonLearningItem {
    return new LessonLearningItem({
      lessonId: this.lessonId,
      learningItemId: this.learningItemId,
      order: this.order,
      createdAt: this.createdAt,
      lesson: this.lesson,
      learningItem: this.learningItem,
    })
  }

  /**
   * So sánh order để sort
   */
  static compareByOrder(a: LessonLearningItem, b: LessonLearningItem): number {
    // Nếu không có order, đẩy xuống cuối
    if (a.order === null || a.order === undefined) return 1
    if (b.order === null || b.order === undefined) return -1
    return a.order - b.order
  }
}

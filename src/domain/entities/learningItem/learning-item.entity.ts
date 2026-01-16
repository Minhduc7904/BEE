// src/domain/entities/learningItem/learning-item.entity.ts
import { LearningItemType } from '../../../shared/enums'
import { Competition } from '../exam/competition.entity'
import { Admin } from '../user/admin.entity'
import { LessonLearningItem } from '../lesson/lesson-learning-item.entity'

export class LearningItem {
  // Required properties
  learningItemId: number
  type: LearningItemType
  title: string
  createdBy: number
  createdAt: Date
  updatedAt: Date

  // Optional properties
  description?: string | null
  competitionId?: number | null

  // Relations (optional - sẽ được populate khi cần)
  competition?: Competition | null
  admin?: Admin
  lessons?: LessonLearningItem[]

  constructor(data: {
    learningItemId: number
    type: LearningItemType
    title: string
    createdBy: number
    createdAt: Date
    updatedAt: Date
    description?: string | null
    competitionId?: number | null
    competition?: Competition | null
    admin?: Admin
    lessons?: LessonLearningItem[]
  }) {
    this.learningItemId = data.learningItemId
    this.type = data.type
    this.title = data.title
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.description = data.description
    this.competitionId = data.competitionId
    this.competition = data.competition
    this.admin = data.admin
    this.lessons = data.lessons
  }

  /**
   * Kiểm tra learning item có description không
   */
  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0)
  }

  /**
   * Kiểm tra learning item có competition không
   */
  hasCompetition(): boolean {
    return this.competitionId !== null && this.competitionId !== undefined
  }

  /**
   * Kiểm tra learning item có được sử dụng trong lessons không
   */
  hasLessons(): boolean {
    return Boolean(this.lessons && this.lessons.length > 0)
  }

  /**
   * Lấy số lượng lessons sử dụng learning item này
   */
  getLessonsCount(): number {
    return this.lessons?.length ?? 0
  }

  /**
   * Kiểm tra type của learning item
   */
  isHomework(): boolean {
    return this.type === LearningItemType.HOMEWORK
  }

  isDocument(): boolean {
    return this.type === LearningItemType.DOCUMENT
  }

  isYoutube(): boolean {
    return this.type === LearningItemType.YOUTUBE
  }


  /**
   * Lấy creator name (nếu có)
   */
  getCreatorName(): string | null {
    if (!this.admin) return null
    return `${this.admin.user?.firstName ?? ''} ${this.admin.user?.lastName ?? ''}`.trim()
  }

  /**
   * Lấy type label tiếng Việt
   */
  getTypeLabel(): string {
    const labels: Record<LearningItemType, string> = {
      [LearningItemType.HOMEWORK]: 'Bài tập về nhà',
      [LearningItemType.DOCUMENT]: 'Tài liệu',
      [LearningItemType.YOUTUBE]: 'Video YouTube',
      [LearningItemType.VIDEO]: 'Video',
    }
    return labels[this.type] || this.type
  }

  /**
   * Tạo plain object từ entity
   */
  toJSON() {
    return {
      learningItemId: this.learningItemId,
      type: this.type,
      title: this.title,
      description: this.description,
      competitionId: this.competitionId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      competition: this.competition,
      admin: this.admin,
      lessons: this.lessons,
    }
  }

  /**
   * So sánh 2 learning items theo learningItemId
   */
  equals(other: LearningItem): boolean {
    return this.learningItemId === other.learningItemId
  }

  /**
   * Clone learning item entity
   */
  clone(): LearningItem {
    return new LearningItem({
      learningItemId: this.learningItemId,
      type: this.type,
      title: this.title,
      description: this.description,
      competitionId: this.competitionId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      competition: this.competition,
      admin: this.admin,
      lessons: this.lessons,
    })
  }
}

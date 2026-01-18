// src/domain/entities/learningItem/learning-item.entity.ts

import { LearningItemType } from '../../../shared/enums'
import { Admin } from '../user/admin.entity'
import { LessonLearningItem } from '../lesson/lesson-learning-item.entity'
import { HomeworkContent } from './homework-content.entity'
import { DocumentContent } from './document-content.entity'
import { YoutubeContent } from './youtube-content.entity'
import { VideoContent } from './video-content.entity'
import { StudentLearningItem } from './student-learning-item.entity'

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

  // Navigation properties
  admin?: Admin
  lessons?: LessonLearningItem[]
  homeworkContents?: HomeworkContent[]
  documentContents?: DocumentContent[]
  youtubeContents?: YoutubeContent[]
  videoContents?: VideoContent[]
  studentLearningItems?: StudentLearningItem[]

  constructor(data: {
    learningItemId: number
    type: LearningItemType
    title: string
    createdBy: number
    createdAt?: Date
    updatedAt?: Date
    description?: string | null
    admin?: Admin
    lessons?: LessonLearningItem[]
    homeworkContents?: HomeworkContent[]
    documentContents?: DocumentContent[]
    youtubeContents?: YoutubeContent[]
    videoContents?: VideoContent[]
    studentLearningItems?: StudentLearningItem[]
  }) {
    this.learningItemId = data.learningItemId
    this.type = data.type
    this.title = data.title
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()

    this.description = data.description
    this.admin = data.admin
    this.lessons = data.lessons
    this.homeworkContents = data.homeworkContents
    this.documentContents = data.documentContents
    this.youtubeContents = data.youtubeContents
    this.videoContents = data.videoContents
    this.studentLearningItems = data.studentLearningItems
  }

  /* ===================== BUSINESS METHODS ===================== */

  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0)
  }

  hasLessons(): boolean {
    return (this.lessons?.length ?? 0) > 0
  }

  getLessonsCount(): number {
    return this.lessons?.length ?? 0
  }

  isHomework(): boolean {
    return this.type === LearningItemType.HOMEWORK
  }

  isDocument(): boolean {
    return this.type === LearningItemType.DOCUMENT
  }

  isYoutube(): boolean {
    return this.type === LearningItemType.YOUTUBE
  }

  isVideo(): boolean {
    return this.type === LearningItemType.VIDEO
  }

  /**
   * Kiểm tra learning item đã được học bởi student nào chưa
   */
  hasBeenUsedByStudents(): boolean {
    return (this.studentLearningItems?.length ?? 0) > 0
  }

  /**
   * Lấy tên người tạo (nếu có)
   */
  getCreatorName(): string | null {
    if (!this.admin?.user) return null
    const { firstName, lastName } = this.admin.user
    return `${firstName ?? ''} ${lastName ?? ''}`.trim() || null
  }

  /**
   * Lấy label type để hiển thị
   */
  getTypeLabel(): string {
    const labels: Record<LearningItemType, string> = {
      [LearningItemType.HOMEWORK]: 'Bài tập về nhà',
      [LearningItemType.DOCUMENT]: 'Tài liệu',
      [LearningItemType.YOUTUBE]: 'Video YouTube',
      [LearningItemType.VIDEO]: 'Video',
    }
    return labels[this.type] ?? this.type
  }

  equals(other: LearningItem): boolean {
    return this.learningItemId === other.learningItemId
  }

  toJSON() {
    return {
      learningItemId: this.learningItemId,
      type: this.type,
      title: this.title,
      description: this.description,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  clone(): LearningItem {
    return new LearningItem({
      learningItemId: this.learningItemId,
      type: this.type,
      title: this.title,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      description: this.description,
      admin: this.admin,
      lessons: this.lessons,
      homeworkContents: this.homeworkContents,
      documentContents: this.documentContents,
      youtubeContents: this.youtubeContents,
      videoContents: this.videoContents,
      studentLearningItems: this.studentLearningItems,
    })
  }
}

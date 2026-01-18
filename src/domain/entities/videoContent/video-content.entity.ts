// src/domain/entities/videoContent/video-content.entity.ts

import { LearningItem } from '../learningItem/learning-item.entity'

export class VideoContent {
  // Required properties
  videoContentId: number
  learningItemId: number
  content: string
  createdAt: Date
  updatedAt: Date

  // Navigation properties
  learningItem?: LearningItem

  constructor(data: {
    videoContentId: number
    learningItemId: number
    content: string
    createdAt?: Date
    updatedAt?: Date
    learningItem?: LearningItem
  }) {
    this.videoContentId = data.videoContentId
    this.learningItemId = data.learningItemId
    this.content = data.content
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.learningItem = data.learningItem
  }

  // Business logic methods
  updateContent(newContent: string): void {
    this.content = newContent
    this.updatedAt = new Date()
  }

  // Validation methods
  isValid(): boolean {
    return (
      this.videoContentId > 0 &&
      this.learningItemId > 0 &&
      this.content.trim().length > 0
    )
  }
}

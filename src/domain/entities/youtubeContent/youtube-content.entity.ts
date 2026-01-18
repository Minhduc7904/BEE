// src/domain/entities/youtubeContent/youtube-content.entity.ts

import { LearningItem } from '../learningItem/learning-item.entity'

export class YoutubeContent {
  // Required properties
  youtubeContentId: number
  learningItemId: number
  content: string
  youtubeUrl: string
  createdAt: Date
  updatedAt: Date

  // Navigation properties
  learningItem?: LearningItem

  constructor(data: {
    youtubeContentId: number
    learningItemId: number
    content: string
    youtubeUrl: string
    createdAt?: Date
    updatedAt?: Date
    learningItem?: LearningItem
  }) {
    this.youtubeContentId = data.youtubeContentId
    this.learningItemId = data.learningItemId
    this.content = data.content
    this.youtubeUrl = data.youtubeUrl
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.learningItem = data.learningItem
  }

  // Business logic methods
  updateContent(newContent: string): void {
    this.content = newContent
    this.updatedAt = new Date()
  }

  updateUrl(newUrl: string): void {
    this.youtubeUrl = newUrl
    this.updatedAt = new Date()
  }

  // Validation methods
  isValid(): boolean {
    return (
      this.youtubeContentId > 0 &&
      this.learningItemId > 0 &&
      this.content.trim().length > 0 &&
      this.youtubeUrl.trim().length > 0 &&
      this.isValidYoutubeUrl()
    )
  }

  isValidYoutubeUrl(): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(this.youtubeUrl)
  }

  getVideoId(): string | null {
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = this.youtubeUrl.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  getThumbnailUrl(): string | null {
    const videoId = this.getVideoId()
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
  }
}

// src/domain/interface/videoContent/video-content.interface.ts
import { VideoContent } from '../../entities'

export interface CreateVideoContentData {
  learningItemId: number
  content: string
}

export interface UpdateVideoContentData {
  content?: string
}

export interface VideoContentFilterOptions {
  learningItemId?: number
  search?: string
}

export interface VideoContentPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface VideoContentSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface VideoContentListResult {
  videoContents: VideoContent[]
  total: number
  page: number
  limit: number
  totalPages: number
}

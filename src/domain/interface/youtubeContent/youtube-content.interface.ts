// src/domain/interface/youtubeContent/youtube-content.interface.ts
import { YoutubeContent } from '../../entities'

export interface CreateYoutubeContentData {
  learningItemId: number
  content: string
  youtubeUrl: string
}

export interface UpdateYoutubeContentData {
  content?: string
  youtubeUrl?: string
}

export interface YoutubeContentFilterOptions {
  learningItemId?: number
  search?: string
}

export interface YoutubeContentPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface YoutubeContentSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface YoutubeContentListResult {
  youtubeContents: YoutubeContent[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// src/domain/interface/homeworkContent/homework-content.interface.ts
import { HomeworkContent } from '../../entities'

export interface CreateHomeworkContentData {
  learningItemId: number
  content: string
  dueDate?: Date
  competitionId?: number
  allowLateSubmit?: boolean
  updatePointsOnLateSubmit?: boolean
  updatePointsOnReSubmit?: boolean
  updateMaxPoints?: boolean
}

export interface UpdateHomeworkContentData {
  content?: string
  dueDate?: Date
  competitionId?: number
  allowLateSubmit?: boolean
  updatePointsOnLateSubmit?: boolean
  updatePointsOnReSubmit?: boolean
  updateMaxPoints?: boolean
}

export interface HomeworkContentFilterOptions {
  learningItemId?: number
  competitionId?: number
  allowLateSubmit?: boolean
  search?: string
}

export interface HomeworkContentPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface HomeworkContentSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface HomeworkContentListResult {
  homeworkContents: HomeworkContent[]
  total: number
  page: number
  limit: number
  totalPages: number
}

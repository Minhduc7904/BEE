// src/domain/interface/learningItem/learning-item.interface.ts
import { LearningItem } from '../../entities'
import { LearningItemType } from '../../../shared/enums'

export interface CreateLearningItemData {
  type: LearningItemType
  title: string
  description?: string
  competitionId?: number
  createdBy: number
}

export interface UpdateLearningItemData {
  type?: LearningItemType
  title?: string
  description?: string
  competitionId?: number
}

export interface LearningItemFilterOptions {
  type?: LearningItemType
  createdBy?: number
  competitionId?: number
  search?: string
}

export interface LearningItemPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LearningItemListResult {
  learningItems: LearningItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

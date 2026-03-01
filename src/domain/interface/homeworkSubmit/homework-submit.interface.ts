// src/domain/interface/homeworkSubmit/homework-submit.interface.ts
import { HomeworkSubmit } from '../../entities'

export interface CreateHomeworkSubmitData {
  homeworkContentId: number
  studentId: number
  content: string
  competitionSubmitId?: number
}

export interface UpdateHomeworkSubmitData {
  content?: string
  points?: number
  graderId?: number
  feedback?: string
  competitionSubmitId?: number
}

export interface GradeHomeworkSubmitData {
  points: number
  graderId: number
  feedback?: string
}

export interface HomeworkSubmitFilterOptions {
  homeworkContentId?: number
  studentId?: number
  graderId?: number
  isGraded?: boolean
  search?: string
}

export interface HomeworkSubmitPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface HomeworkSubmitSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface HomeworkSubmitListResult {
  homeworkSubmits: HomeworkSubmit[]
  total: number
  page: number
  limit: number
  totalPages: number
}

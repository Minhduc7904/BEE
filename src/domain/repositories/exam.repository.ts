// src/domain/repositories/exam.repository.ts
import { Exam } from '../entities/exam/exam.entity'
import { ExamVisibility } from 'src/shared/enums'

export interface CreateExamData {
  title: string
  grade: number
  visibility: ExamVisibility
  adminId: number
  description?: string | null
  subjectId?: number | null
  solutionYoutubeUrl?: string | null
}

export interface ExamFilterOptions {
  subjectId?: number
  grade?: number
  visibility?: ExamVisibility
  createdBy?: number
  search?: string
}

export interface ExamPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ExamListResult {
  exams: Exam[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IExamRepository {
  create(data: CreateExamData, txClient?: any): Promise<Exam>
  findById(id: number, txClient?: any): Promise<Exam | null>
  update(id: number, data: Partial<CreateExamData>, txClient?: any): Promise<Exam>
  delete(id: number, txClient?: any): Promise<void>
  findAllWithPagination(
    pagination: ExamPaginationOptions,
    filters?: ExamFilterOptions,
    txClient?: any,
  ): Promise<ExamListResult>
}

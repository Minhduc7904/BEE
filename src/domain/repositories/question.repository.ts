// src/domain/repositories/question.repository.ts
import { Question } from '../entities/exam/question.entity'
import { QuestionType, Difficulty, Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
export interface CreateQuestionData {
  content: string
  type: QuestionType
  difficulty: Difficulty | null
  grade?: number | null
  visibility: Visibility
  createdBy: number
  correctAnswer?: string | null
  solution?: string | null
  solutionYoutubeUrl?: string | null
  subjectId?: number | null
  pointsOrigin?: number | null
}

export interface QuestionFilterOptions {
  subjectId?: number
  type?: QuestionType
  difficulty?: Difficulty
  grade?: number
  visibility?: Visibility
  createdBy?: number
  chapterId?: number
  search?: string
}

export interface QuestionPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
}

export interface QuestionListResult {
  questions: Question[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IQuestionRepository {
  create(data: CreateQuestionData, txClient?: any): Promise<Question>
  createMany(dataArray: CreateQuestionData[], txClient?: any): Promise<number>
  findById(id: number, txClient?: any): Promise<Question | null>
  findByIds(ids: number[], txClient?: any): Promise<Question[]>
  update(id: number, data: Partial<CreateQuestionData>, txClient?: any): Promise<Question>
  delete(id: number, txClient?: any): Promise<void>
  findAllWithPagination(
    pagination: QuestionPaginationOptions,
    filters?: QuestionFilterOptions,
    txClient?: any,
  ): Promise<QuestionListResult>
}

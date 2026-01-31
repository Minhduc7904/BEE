import { ExamImportSession } from '../entities/exam-import/exam-import-session.entity'
import { ImportStatus } from '../../shared/enums'

export interface CreateExamImportSessionData {
  rawContent?: string
  metadata?: any
  createdBy: number
}

export interface UpdateExamImportSessionData {
  status?: ImportStatus
  rawContent?: string
  metadata?: any
  approvedBy?: number
  approvedAt?: Date
  completedAt?: Date
}

export interface FindAllExamImportSessionsOptions {
  skip?: number
  take?: number
  status?: ImportStatus
  createdBy?: number
  search?: string
  fromDate?: Date
  toDate?: Date
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FindAllExamImportSessionsResult {
  data: ExamImportSession[]
  total: number
}

export interface IExamImportSessionRepository {
  create(data: CreateExamImportSessionData): Promise<ExamImportSession>
  findById(sessionId: number): Promise<ExamImportSession | null>
  findByIdWithRelations(sessionId: number): Promise<ExamImportSession | null>
  findAll(options: FindAllExamImportSessionsOptions): Promise<FindAllExamImportSessionsResult>
  findByStatus(status: ImportStatus): Promise<ExamImportSession[]>
  findByCreatedBy(createdBy: number): Promise<ExamImportSession[]>
  update(sessionId: number, data: UpdateExamImportSessionData): Promise<ExamImportSession>
  delete(sessionId: number): Promise<void>
  updateStatus(sessionId: number, status: ImportStatus): Promise<ExamImportSession>
  approve(sessionId: number, approvedBy: number): Promise<ExamImportSession>
  complete(sessionId: number): Promise<ExamImportSession>
}

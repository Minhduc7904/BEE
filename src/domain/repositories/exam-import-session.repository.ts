import { ExamImportSession } from '../entities/exam-import/exam-import-session.entity'
import { ImportStatus } from '../../shared/enums'

export interface CreateExamImportSessionData {
  fileName: string
  fileUrl?: string
  rawContent?: string
  metadata?: any
  createdBy: number
}

export interface UpdateExamImportSessionData {
  status?: ImportStatus
  fileUrl?: string
  rawContent?: string
  errorLog?: string
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
  findById(sessionId: string): Promise<ExamImportSession | null>
  findByIdWithRelations(sessionId: string): Promise<ExamImportSession | null>
  findAll(options: FindAllExamImportSessionsOptions): Promise<FindAllExamImportSessionsResult>
  findByStatus(status: ImportStatus): Promise<ExamImportSession[]>
  findByCreatedBy(createdBy: number): Promise<ExamImportSession[]>
  update(sessionId: string, data: UpdateExamImportSessionData): Promise<ExamImportSession>
  delete(sessionId: string): Promise<void>
  updateStatus(sessionId: string, status: ImportStatus): Promise<ExamImportSession>
  approve(sessionId: string, approvedBy: number): Promise<ExamImportSession>
  complete(sessionId: string): Promise<ExamImportSession>
}

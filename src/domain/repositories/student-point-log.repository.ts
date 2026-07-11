import { StudentPointLog } from '../entities'
import { PointType } from '../../shared/enums'

export interface CreateStudentPointLogData {
  studentId: number
  type: PointType
  points: number
  source: string
  referenceType?: string | null
  referenceId?: number | null
  note?: string | null
  metadata?: any
}

export interface UpdateStudentPointLogData {
  type?: PointType
  points?: number
  source?: string
  referenceType?: string | null
  referenceId?: number | null
  note?: string | null
  metadata?: any
}

export interface StudentPointLogFilterOptions {
  studentId?: number
  type?: PointType
  source?: string
  referenceType?: string
  referenceId?: number
  search?: string
  fromDate?: string
  toDate?: string
}

export interface StudentPointLogPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface StudentPointLogListResult {
  data: StudentPointLog[]
  total: number
}

export interface IStudentPointLogRepository {
  create(data: CreateStudentPointLogData): Promise<StudentPointLog>
  findById(pointLogId: number): Promise<StudentPointLog | null>
  findByStudent(studentId: number, pagination: StudentPointLogPaginationOptions, filters?: StudentPointLogFilterOptions): Promise<StudentPointLogListResult>
  findByReference(studentId: number, source: string, referenceType: string, referenceId: number): Promise<StudentPointLog | null>
  createAndApply(data: CreateStudentPointLogData): Promise<StudentPointLog>
  syncByReferenceAndApply(data: CreateStudentPointLogData): Promise<StudentPointLog | null>
  updateAndApply(pointLogId: number, data: UpdateStudentPointLogData): Promise<StudentPointLog>
  deleteAndApply(pointLogId: number): Promise<StudentPointLog>
}

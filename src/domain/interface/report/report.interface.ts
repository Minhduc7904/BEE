import { ReportReason, ReportStatus, ReportTargetType } from '../../../shared/enums'
import { Report } from '../../entities/report/report.entity'

export interface ReportTargetReference {
  targetType: ReportTargetType
  reportedAdminId?: number | null
  questionId?: number | null
  examId?: number | null
  classId?: number | null
  sessionId?: number | null
  pageUrl?: string | null
}

export interface CreateReportData extends ReportTargetReference {
  reporterId?: number | null
  reason: ReportReason
  description?: string | null
}

export interface UpdateReportData {
  reason?: ReportReason
  description?: string | null
  status?: ReportStatus
  handledById?: number | null
  handledAt?: Date | null
  resolutionNote?: string | null
}

export interface ReportFilterOptions {
  targetType?: ReportTargetType
  reason?: ReportReason
  status?: ReportStatus
  reporterId?: number
  reportedAdminId?: number
  questionId?: number
  examId?: number
  classId?: number
  sessionId?: number
  handledById?: number
  search?: string
  fromDate?: Date
  toDate?: Date
}

export interface ReportPaginationOptions {
  page: number
  limit: number
  sortBy: 'reportId' | 'createdAt' | 'updatedAt' | 'handledAt' | 'status' | 'targetType' | 'reason'
  sortOrder: 'asc' | 'desc'
}

export interface ReportListResult {
  data: Report[]
  total: number
  page: number
  limit: number
}

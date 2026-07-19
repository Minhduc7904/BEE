import { ReportReason, ReportStatus, ReportTargetType } from '../../../shared/enums'

export interface ReportUserSummary {
  userId: number
  username: string
  firstName: string
  lastName: string
}

export interface ReportAdminSummary extends ReportUserSummary {
  adminId: number
}

export class Report {
  reportId: number
  reporterId?: number | null
  targetType: ReportTargetType
  reason: ReportReason
  description?: string | null
  status: ReportStatus
  reportedAdminId?: number | null
  questionId?: number | null
  examId?: number | null
  classId?: number | null
  sessionId?: number | null
  pageUrl?: string | null
  handledById?: number | null
  handledAt?: Date | null
  resolutionNote?: string | null
  createdAt: Date
  updatedAt: Date

  reporter?: ReportUserSummary | null
  reportedAdmin?: ReportAdminSummary | null
  handledBy?: ReportAdminSummary | null
  question?: { questionId: number; slug: string } | null
  exam?: { examId: number; title: string } | null
  courseClass?: { classId: number; className: string } | null
  classSession?: { sessionId: number; classId: number; name: string; sessionDate: Date } | null

  constructor(data: Omit<Report, 'isClosed'>) {
    Object.assign(this, data)
  }

  isClosed(): boolean {
    return this.status === ReportStatus.RESOLVED || this.status === ReportStatus.REJECTED
  }
}

import { Report } from 'src/domain/entities/report/report.entity'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export class ReportResponseDto {
  reportId: number
  reporterId?: number | null
  targetType: string
  reason: string
  description?: string | null
  status: string
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
  isClosed: boolean
  reporter?: { userId: number; username: string; fullName: string } | null
  reportedAdmin?: { adminId: number; userId: number; username: string; fullName: string } | null
  handledBy?: { adminId: number; userId: number; username: string; fullName: string } | null
  question?: { questionId: number; slug: string } | null
  exam?: { examId: number; title: string } | null
  courseClass?: { classId: number; className: string } | null
  classSession?: { sessionId: number; classId: number; name: string; sessionDate: Date } | null

  constructor(report: Report) {
    this.reportId = report.reportId
    this.reporterId = report.reporterId
    this.targetType = report.targetType
    this.reason = report.reason
    this.description = report.description
    this.status = report.status
    this.reportedAdminId = report.reportedAdminId
    this.questionId = report.questionId
    this.examId = report.examId
    this.classId = report.classId
    this.sessionId = report.sessionId
    this.pageUrl = report.pageUrl
    this.handledById = report.handledById
    this.handledAt = report.handledAt
    this.resolutionNote = report.resolutionNote
    this.createdAt = report.createdAt
    this.updatedAt = report.updatedAt
    this.isClosed = report.isClosed()
    this.reporter = report.reporter ? {
      userId: report.reporter.userId,
      username: report.reporter.username,
      fullName: `${report.reporter.lastName} ${report.reporter.firstName}`,
    } : null
    this.reportedAdmin = report.reportedAdmin ? {
      adminId: report.reportedAdmin.adminId,
      userId: report.reportedAdmin.userId,
      username: report.reportedAdmin.username,
      fullName: `${report.reportedAdmin.lastName} ${report.reportedAdmin.firstName}`,
    } : null
    this.handledBy = report.handledBy ? {
      adminId: report.handledBy.adminId,
      userId: report.handledBy.userId,
      username: report.handledBy.username,
      fullName: `${report.handledBy.lastName} ${report.handledBy.firstName}`,
    } : null
    this.question = report.question
    this.exam = report.exam
    this.courseClass = report.courseClass
    this.classSession = report.classSession
  }
}

export class ReportListResponseDto extends PaginationResponseDto<ReportResponseDto> {
  constructor(data: ReportResponseDto[], page: number, limit: number, total: number) {
    super(true, 'Lấy danh sách báo cáo thành công', data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasPrevious: page > 1,
      hasNext: page < Math.ceil(total / limit),
      previousPage: page > 1 ? page - 1 : undefined,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : undefined,
    })
  }
}

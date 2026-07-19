import { Report, ReportAdminSummary, ReportUserSummary } from '../../../domain/entities/report/report.entity'
import { ReportReason, ReportStatus, ReportTargetType } from '../../../shared/enums'

export class ReportMapper {
  static toDomainReport(prismaReport: any): Report | undefined {
    if (!prismaReport) return undefined

    return new Report({
      reportId: prismaReport.reportId,
      reporterId: prismaReport.reporterId ?? null,
      targetType: prismaReport.targetType as ReportTargetType,
      reason: prismaReport.reason as ReportReason,
      description: prismaReport.description ?? null,
      status: prismaReport.status as ReportStatus,
      reportedAdminId: prismaReport.reportedAdminId ?? null,
      questionId: prismaReport.questionId ?? null,
      examId: prismaReport.examId ?? null,
      classId: prismaReport.classId ?? null,
      sessionId: prismaReport.sessionId ?? null,
      pageUrl: prismaReport.pageUrl ?? null,
      handledById: prismaReport.handledById ?? null,
      handledAt: prismaReport.handledAt ?? null,
      resolutionNote: prismaReport.resolutionNote ?? null,
      createdAt: prismaReport.createdAt,
      updatedAt: prismaReport.updatedAt,
      reporter: this.toUserSummary(prismaReport.reporter),
      reportedAdmin: this.toAdminSummary(prismaReport.reportedAdmin),
      handledBy: this.toAdminSummary(prismaReport.handledBy),
      question: prismaReport.question
        ? { questionId: prismaReport.question.questionId, slug: prismaReport.question.slug }
        : null,
      exam: prismaReport.exam
        ? { examId: prismaReport.exam.examId, title: prismaReport.exam.title }
        : null,
      courseClass: prismaReport.courseClass
        ? { classId: prismaReport.courseClass.classId, className: prismaReport.courseClass.className }
        : null,
      classSession: prismaReport.classSession
        ? {
            sessionId: prismaReport.classSession.sessionId,
            classId: prismaReport.classSession.classId,
            name: prismaReport.classSession.name,
            sessionDate: prismaReport.classSession.sessionDate,
          }
        : null,
    })
  }

  static toDomainReports(prismaReports: any[]): Report[] {
    return prismaReports
      .map((report) => this.toDomainReport(report))
      .filter(Boolean) as Report[]
  }

  private static toUserSummary(user: any): ReportUserSummary | null {
    if (!user) return null
    return {
      userId: user.userId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    }
  }

  private static toAdminSummary(admin: any): ReportAdminSummary | null {
    if (!admin?.user) return null
    return {
      adminId: admin.adminId,
      userId: admin.user.userId,
      username: admin.user.username,
      firstName: admin.user.firstName,
      lastName: admin.user.lastName,
    }
  }
}

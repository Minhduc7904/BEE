import { PrismaService } from '../../../prisma/prisma.service'
import { Report } from '../../../domain/entities/report/report.entity'
import type { IReportRepository } from '../../../domain/repositories/report.repository'
import type {
  CreateReportData,
  ReportFilterOptions,
  ReportListResult,
  ReportPaginationOptions,
  ReportTargetReference,
  UpdateReportData,
} from '../../../domain/interface/report/report.interface'
import { ReportTargetType } from '../../../shared/enums'
import { NumberUtil } from '../../../shared/utils/number.util'
import { ReportMapper } from '../../mappers/report/report.mapper'

export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  private readonly include = {
    reporter: {
      select: { userId: true, username: true, firstName: true, lastName: true },
    },
    reportedAdmin: {
      include: { user: { select: { userId: true, username: true, firstName: true, lastName: true } } },
    },
    handledBy: {
      include: { user: { select: { userId: true, username: true, firstName: true, lastName: true } } },
    },
    question: { select: { questionId: true, slug: true } },
    exam: { select: { examId: true, title: true } },
    courseClass: { select: { classId: true, className: true } },
    classSession: { select: { sessionId: true, classId: true, name: true, sessionDate: true } },
  }

  async create(data: CreateReportData): Promise<Report> {
    const report = await this.prisma.report.create({ data, include: this.include })
    return ReportMapper.toDomainReport(report)!
  }

  async findById(id: number): Promise<Report | null> {
    const reportId = NumberUtil.ensureValidId(id, 'Report ID')
    const report = await this.prisma.report.findUnique({ where: { reportId }, include: this.include })
    return ReportMapper.toDomainReport(report) ?? null
  }

  async update(id: number, data: UpdateReportData): Promise<Report> {
    const reportId = NumberUtil.ensureValidId(id, 'Report ID')
    const report = await this.prisma.report.update({ where: { reportId }, data, include: this.include })
    return ReportMapper.toDomainReport(report)!
  }

  async delete(id: number): Promise<boolean> {
    const reportId = NumberUtil.ensureValidId(id, 'Report ID')
    await this.prisma.report.delete({ where: { reportId } })
    return true
  }

  async findAllWithPagination(
    pagination: ReportPaginationOptions,
    filters?: ReportFilterOptions,
  ): Promise<ReportListResult> {
    return this.findWithPagination(pagination, this.buildWhere(filters))
  }

  async findByReporterWithPagination(
    reporterId: number,
    pagination: ReportPaginationOptions,
    filters?: ReportFilterOptions,
  ): Promise<ReportListResult> {
    const userId = NumberUtil.ensureValidId(reporterId, 'Reporter ID')
    const filtersWhere = this.buildWhere(filters)
    return this.findWithPagination(pagination, { AND: [{ reporterId: userId }, filtersWhere] })
  }

  async targetExists(target: ReportTargetReference): Promise<boolean> {
    switch (target.targetType) {
      case ReportTargetType.ADMIN:
        return Boolean(await this.prisma.admin.findUnique({ where: { adminId: target.reportedAdminId! }, select: { adminId: true } }))
      case ReportTargetType.QUESTION:
        return Boolean(await this.prisma.question.findUnique({ where: { questionId: target.questionId! }, select: { questionId: true } }))
      case ReportTargetType.EXAM:
        return Boolean(await this.prisma.exam.findUnique({ where: { examId: target.examId! }, select: { examId: true } }))
      case ReportTargetType.CLASS:
        return Boolean(await this.prisma.courseClass.findUnique({ where: { classId: target.classId! }, select: { classId: true } }))
      case ReportTargetType.CLASS_SESSION:
        return Boolean(await this.prisma.classSession.findUnique({ where: { sessionId: target.sessionId! }, select: { sessionId: true } }))
      case ReportTargetType.WEBSITE:
        return Boolean(target.pageUrl)
    }
  }

  private async findWithPagination(pagination: ReportPaginationOptions, where: any): Promise<ReportListResult> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const allowedSortFields = ['reportId', 'createdAt', 'updatedAt', 'handledAt', 'status', 'targetType', 'reason']
    const sortBy = allowedSortFields.includes(pagination.sortBy) ? pagination.sortBy : 'createdAt'
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: this.include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: pagination.sortOrder || 'desc' },
      }),
      this.prisma.report.count({ where }),
    ])

    return { data: ReportMapper.toDomainReports(reports), total, page, limit }
  }

  private buildWhere(filters?: ReportFilterOptions): any {
    const conditions: any[] = []
    if (filters?.targetType) conditions.push({ targetType: filters.targetType })
    if (filters?.reason) conditions.push({ reason: filters.reason })
    if (filters?.status) conditions.push({ status: filters.status })
    if (filters?.reporterId) conditions.push({ reporterId: filters.reporterId })
    if (filters?.reportedAdminId) conditions.push({ reportedAdminId: filters.reportedAdminId })
    if (filters?.questionId) conditions.push({ questionId: filters.questionId })
    if (filters?.examId) conditions.push({ examId: filters.examId })
    if (filters?.classId) conditions.push({ classId: filters.classId })
    if (filters?.sessionId) conditions.push({ sessionId: filters.sessionId })
    if (filters?.handledById) conditions.push({ handledById: filters.handledById })
    if (filters?.search) {
      conditions.push({ OR: [
        { description: { contains: filters.search } },
        { resolutionNote: { contains: filters.search } },
        { pageUrl: { contains: filters.search } },
      ] })
    }
    if (filters?.fromDate || filters?.toDate) {
      conditions.push({ createdAt: { gte: filters.fromDate, lte: filters.toDate } })
    }
    return conditions.length ? { AND: conditions } : {}
  }
}

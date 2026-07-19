import { Report } from '../entities/report/report.entity'
import {
  CreateReportData,
  ReportFilterOptions,
  ReportListResult,
  ReportPaginationOptions,
  ReportTargetReference,
  UpdateReportData,
} from '../interface/report/report.interface'

export interface IReportRepository {
  create(data: CreateReportData): Promise<Report>
  findById(id: number): Promise<Report | null>
  update(id: number, data: UpdateReportData): Promise<Report>
  delete(id: number): Promise<boolean>
  findAllWithPagination(pagination: ReportPaginationOptions, filters?: ReportFilterOptions): Promise<ReportListResult>
  findByReporterWithPagination(reporterId: number, pagination: ReportPaginationOptions, filters?: ReportFilterOptions): Promise<ReportListResult>
  targetExists(target: ReportTargetReference): Promise<boolean>
}

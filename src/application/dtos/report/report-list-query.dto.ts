import { ReportFilterOptions, ReportPaginationOptions } from 'src/domain/interface/report/report.interface'
import { IsOptionalEnumValue, IsOptionalIdNumber } from 'src/shared/decorators/validate'
import { ReportReason, ReportStatus, ReportTargetType } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { ListQueryDto } from '../pagination/list-query.dto'

class BaseReportListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(ReportTargetType, 'Loại đối tượng báo cáo')
  targetType?: ReportTargetType

  @IsOptionalEnumValue(ReportReason, 'Lý do báo cáo')
  reason?: ReportReason

  @IsOptionalEnumValue(ReportStatus, 'Trạng thái báo cáo')
  status?: ReportStatus

  @IsOptionalIdNumber('reportedAdminId')
  reportedAdminId?: number

  @IsOptionalIdNumber('questionId')
  questionId?: number

  @IsOptionalIdNumber('examId')
  examId?: number

  @IsOptionalIdNumber('classId')
  classId?: number

  @IsOptionalIdNumber('sessionId')
  sessionId?: number

  @IsOptionalIdNumber('handledById')
  handledById?: number

  toReportFilters(): ReportFilterOptions {
    return {
      targetType: this.targetType,
      reason: this.reason,
      status: this.status,
      reportedAdminId: this.reportedAdminId,
      questionId: this.questionId,
      examId: this.examId,
      classId: this.classId,
      sessionId: this.sessionId,
      handledById: this.handledById,
      search: this.search,
      fromDate: this.fromDate ? new Date(this.fromDate) : undefined,
      toDate: this.toDate ? new Date(this.toDate) : undefined,
    }
  }

  toReportPagination(): ReportPaginationOptions {
    const sortField = this.sortBy || 'createdAt'
    const allowedSortFields: ReportPaginationOptions['sortBy'][] = [
      'reportId', 'createdAt', 'updatedAt', 'handledAt', 'status', 'targetType', 'reason',
    ]
    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: allowedSortFields.includes(sortField as ReportPaginationOptions['sortBy'])
        ? sortField as ReportPaginationOptions['sortBy']
        : 'createdAt',
      sortOrder: this.sortOrder || SortOrder.DESC,
    }
  }
}

/** Query DTO dành cho admin; có thể lọc theo người gửi. */
export class ReportListQueryDto extends BaseReportListQueryDto {
  @IsOptionalIdNumber('reporterId')
  reporterId?: number

  override toReportFilters(): ReportFilterOptions {
    return { ...super.toReportFilters(), reporterId: this.reporterId }
  }
}

/** Query DTO dành cho người gửi; không nhận reporterId để tránh truy vấn chéo dữ liệu. */
export class MyReportListQueryDto extends BaseReportListQueryDto {}

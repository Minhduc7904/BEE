import type { BackgroundJobRunListOptions } from '../../../domain/interface/background-job'
import { BackgroundJobRunStatus } from '../../../shared/enums'
import { SortOrder } from '../../../shared/enums/sort-order.enum'
import { IsOptionalEnumValue, IsOptionalIdNumber, IsOptionalString } from '../../../shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'

export class BackgroundJobRunListQueryDto extends ListQueryDto {
  @IsOptionalIdNumber('ID job nền')
  backgroundJobId?: number

  @IsOptionalEnumValue(BackgroundJobRunStatus, 'Trạng thái lần chạy')
  status?: BackgroundJobRunStatus

  @IsOptionalString('Worker ID', 100)
  workerId?: string

  toBackgroundJobRunListOptions(): BackgroundJobRunListOptions {
    const allowedSortFields = [
      'backgroundJobRunId',
      'backgroundJobId',
      'scheduledAt',
      'startedAt',
      'finishedAt',
      'status',
    ] as const
    const sortBy = allowedSortFields.includes(this.sortBy as (typeof allowedSortFields)[number])
      ? (this.sortBy as NonNullable<BackgroundJobRunListOptions['sortBy']>)
      : 'scheduledAt'

    return {
      skip: this.offset,
      take: this.limit ?? 10,
      backgroundJobId: this.backgroundJobId,
      status: this.status,
      workerId: this.workerId,
      fromScheduledAt: this.fromDate ? new Date(this.fromDate) : undefined,
      toScheduledAt: this.toDate ? new Date(this.toDate) : undefined,
      sortBy,
      sortOrder: this.sortOrder === SortOrder.ASC ? 'asc' : 'desc',
    }
  }
}

import type { BackgroundJobLockListOptions } from '../../../domain/interface/background-job'
import { SortOrder } from '../../../shared/enums/sort-order.enum'
import { IsOptionalBoolean, IsOptionalIdNumber } from '../../../shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'

export class BackgroundJobLockListQueryDto extends ListQueryDto {
  @IsOptionalIdNumber('ID job nền')
  backgroundJobId?: number

  @IsOptionalBoolean('Trạng thái lock đang hiệu lực')
  isActive?: boolean

  toBackgroundJobLockListOptions(): BackgroundJobLockListOptions {
    const allowedSortFields = ['backgroundJobId', 'workerId', 'lockedAt', 'leaseExpiresAt', 'updatedAt'] as const
    const sortBy = allowedSortFields.includes(this.sortBy as (typeof allowedSortFields)[number])
      ? (this.sortBy as NonNullable<BackgroundJobLockListOptions['sortBy']>)
      : 'leaseExpiresAt'

    return {
      skip: this.offset,
      take: this.limit ?? 10,
      backgroundJobId: this.backgroundJobId,
      isActive: this.isActive,
      search: this.search,
      sortBy,
      sortOrder: this.sortOrder === SortOrder.ASC ? 'asc' : 'desc',
    }
  }
}

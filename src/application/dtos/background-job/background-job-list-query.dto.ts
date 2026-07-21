import type { BackgroundJobListOptions } from '../../../domain/interface/background-job'
import { BackgroundJobCode } from '../../../shared/enums'
import { SortOrder } from '../../../shared/enums/sort-order.enum'
import { IsOptionalBoolean, IsOptionalEnumValue } from '../../../shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'

export class BackgroundJobListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(BackgroundJobCode, 'Mã job')
  code?: BackgroundJobCode

  @IsOptionalBoolean('Trạng thái bật job')
  isEnabled?: boolean

  toBackgroundJobListOptions(): BackgroundJobListOptions {
    const allowedSortFields = ['backgroundJobId', 'code', 'displayName', 'isEnabled', 'createdAt', 'updatedAt'] as const
    const sortBy = allowedSortFields.includes(this.sortBy as (typeof allowedSortFields)[number])
      ? (this.sortBy as NonNullable<BackgroundJobListOptions['sortBy']>)
      : 'backgroundJobId'

    return {
      skip: this.offset,
      take: this.limit ?? 10,
      code: this.code,
      isEnabled: this.isEnabled,
      search: this.search,
      sortBy,
      sortOrder: this.sortOrder === SortOrder.ASC ? 'asc' : 'desc',
    }
  }
}

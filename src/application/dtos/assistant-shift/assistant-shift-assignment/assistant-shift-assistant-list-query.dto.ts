import { ListQueryDto } from '../../pagination/list-query.dto'
import { SortOrder } from '../../../../shared/enums/sort-order.enum'

export class AssistantShiftAssistantListQueryDto extends ListQueryDto {
  toAssistantPaginationOptions(): {
    page: number
    limit: number
    sortBy: 'adminId' | 'createdAt' | 'updatedAt'
    sortOrder: SortOrder
  } {
    this.normalize()

    const allowedSortFields = ['adminId', 'createdAt', 'updatedAt'] as const
    const sortBy = allowedSortFields.includes(this.sortBy as (typeof allowedSortFields)[number])
      ? (this.sortBy as (typeof allowedSortFields)[number])
      : 'adminId'

    return {
      page: this.page ?? 1,
      limit: this.limit ?? 10,
      sortBy,
      sortOrder: this.sortOrder ?? SortOrder.DESC,
    }
  }
}

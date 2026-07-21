import type { SepayTransactionSyncCursorListOptions } from '../../../domain/interface/sepay'
import { SortOrder } from '../../../shared/enums/sort-order.enum'
import { ListQueryDto } from '../pagination/list-query.dto'

export class SepayTransactionSyncCursorListQueryDto extends ListQueryDto {
  toSepayTransactionSyncCursorListOptions(): SepayTransactionSyncCursorListOptions {
    const allowedSortFields = [
      'sepayTransactionSyncCursorId',
      'scope',
      'lastSyncedAt',
      'lastErrorAt',
      'createdAt',
      'updatedAt',
    ] as const
    const sortBy = allowedSortFields.includes(this.sortBy as (typeof allowedSortFields)[number])
      ? (this.sortBy as NonNullable<SepayTransactionSyncCursorListOptions['sortBy']>)
      : 'scope'

    return {
      skip: this.offset,
      take: this.limit ?? 10,
      search: this.search,
      sortBy,
      sortOrder: this.sortOrder === SortOrder.ASC ? 'asc' : 'desc',
    }
  }
}

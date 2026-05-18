import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalBoolean, IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { TagType } from 'src/shared/enums'

export class TagListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(TagType, 'Loai tag')
  type?: TagType

  @IsOptionalBoolean('Trang thai kich hoat')
  isActive?: boolean

  toTagPaginationOptions() {
    const sortField = this.sortBy || 'createdAt'
    const sortDirection = this.sortOrder || SortOrder.DESC
    const allowedSortFields = ['tagId', 'name', 'slug', 'type', 'isActive', 'createdAt', 'updatedAt']

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: allowedSortFields.includes(sortField) ? sortField : 'createdAt',
      sortOrder: sortDirection,
    }
  }
}

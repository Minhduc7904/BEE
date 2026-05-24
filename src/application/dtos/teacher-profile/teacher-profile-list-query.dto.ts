import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalBoolean, IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export class TeacherProfileListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Giao vien noi bat')
  isFeatured?: boolean

  toTeacherProfilePaginationOptions() {
    const sortField = this.sortBy || 'sortOrder'
    const sortDirection = this.sortOrder || SortOrder.ASC
    const allowedSortFields = [
      'teacherProfileId',
      'displayName',
      'slug',
      'visibility',
      'isFeatured',
      'viewCount',
      'sortOrder',
      'createdAt',
      'updatedAt',
    ]

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: allowedSortFields.includes(sortField) ? sortField : 'sortOrder',
      sortOrder: sortDirection,
    }
  }
}

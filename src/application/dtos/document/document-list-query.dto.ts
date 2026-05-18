import { ListQueryDto } from '../pagination/list-query.dto'
import {
  IsOptionalBoolean,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalIntArray,
} from 'src/shared/decorators/validate'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export class DocumentListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Tai lieu noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Tag', 1)
  tagId?: number

  @IsOptionalIntArray('Danh sach tag')
  tagIds?: number[]

  @IsOptionalBoolean('Kem danh sach tag')
  includeTags?: boolean

  toDocumentPaginationOptions() {
    const sortField = this.sortBy || 'createdAt'
    const sortDirection = this.sortOrder || SortOrder.DESC
    const allowedSortFields = [
      'documentId',
      'title',
      'slug',
      'visibility',
      'isFeatured',
      'viewCount',
      'downloadCount',
      'createdAt',
      'updatedAt',
    ]

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: allowedSortFields.includes(sortField) ? sortField : 'createdAt',
      sortOrder: sortDirection,
    }
  }
}

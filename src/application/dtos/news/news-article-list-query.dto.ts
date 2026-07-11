import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalBoolean, IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { NewsArticleType, Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export class NewsArticleListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(NewsArticleType, 'Loai bai viet')
  type?: NewsArticleType

  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Bai viet noi bat')
  isFeatured?: boolean

  toNewsArticlePaginationOptions() {
    const sortField = this.sortBy || 'publishedAt'
    const allowedSortFields = [
      'newsArticleId', 'type', 'title', 'slug', 'authorName', 'publishedAt',
      'visibility', 'isFeatured', 'viewCount', 'readingTime', 'sortOrder', 'createdAt', 'updatedAt',
    ]

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: allowedSortFields.includes(sortField) ? sortField : 'publishedAt',
      sortOrder: this.sortOrder || SortOrder.DESC,
    }
  }
}

import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalBoolean, IsOptionalString, IsOptionalStringArray } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export class StudentBookListQueryDto extends ListQueryDto {
  @IsOptionalBoolean('Sách nổi bật')
  isFeatured?: boolean

  @IsOptionalString('Slug loại sách', 180, 2)
  categorySlug?: string

  @IsOptionalStringArray('Danh sách slug loại sách')
  categorySlugs?: string[]

  getCategorySlugs(): string[] | undefined {
    const categorySlugs = Array.from(
      new Set(
        [...(this.categorySlugs ?? []), this.categorySlug].filter(
          (slug): slug is string => typeof slug === 'string' && slug.length > 0,
        ),
      ),
    )
    return categorySlugs.length ? categorySlugs : undefined
  }

  toBookPaginationOptions() {
    const allowedSortFields = [
      'bookId',
      'title',
      'priceVnd',
      'isFeatured',
      'viewCount',
      'createdAt',
      'updatedAt',
    ] as const
    const sortBy = allowedSortFields.includes(this.sortBy as (typeof allowedSortFields)[number])
      ? (this.sortBy as (typeof allowedSortFields)[number])
      : 'createdAt'
    return { page: this.page ?? 1, limit: this.limit ?? 10, sortBy, sortOrder: this.sortOrder ?? SortOrder.DESC }
  }
}

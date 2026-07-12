import { IsIn } from 'class-validator'
import { IsOptionalEnumValue, IsOptionalInt } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export class PublicSeoSitemapQueryDto {
  @IsOptionalInt('Số trang', 1)
  page?: number = 1

  @IsOptionalInt('Kích thước trang', 1, 1000)
  limit?: number = 1000

  @IsIn(['updatedAt'], { message: 'sortBy chỉ hỗ trợ updatedAt' })
  sortBy?: 'updatedAt' = 'updatedAt'

  @IsOptionalEnumValue(SortOrder, 'Thứ tự sắp xếp')
  sortOrder?: SortOrder = SortOrder.DESC
}

export class PublicSeoSitemapEntryDto {
  slug: string
  updatedAt: Date
}

export class PublicSeoSitemapMetaDto {
  page: number
  limit: number
  total: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export class PublicSeoSitemapResponseDto {
  success: boolean
  data: PublicSeoSitemapEntryDto[]
  meta: PublicSeoSitemapMetaDto
}

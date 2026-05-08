import { SeoMediaSlotEntity } from 'src/domain/entities'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { SeoMediaItemResponseDto } from './seo-media-item-response.dto'

export class SeoMediaSlotResponseDto {
  slotId: number
  code: string
  name: string
  pageKey: string | null
  type: string
  description: string | null
  isActive: boolean
  minItems: number
  maxItems: number | null
  recommendedWidth: number | null
  recommendedHeight: number | null
  metadata: unknown | null
  createdAt: Date
  updatedAt: Date
  items?: SeoMediaItemResponseDto[]

  static fromEntity(entity: SeoMediaSlotEntity): SeoMediaSlotResponseDto {
    const dto = new SeoMediaSlotResponseDto()
    dto.slotId = entity.slotId
    dto.code = entity.code
    dto.name = entity.name
    dto.pageKey = entity.pageKey
    dto.type = entity.type
    dto.description = entity.description
    dto.isActive = entity.isActive
    dto.minItems = entity.minItems
    dto.maxItems = entity.maxItems
    dto.recommendedWidth = entity.recommendedWidth
    dto.recommendedHeight = entity.recommendedHeight
    dto.metadata = entity.metadata
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    dto.items = entity.items
      ? SeoMediaItemResponseDto.fromEntityList(entity.items)
      : undefined

    return dto
  }

  static fromEntityList(entities: SeoMediaSlotEntity[]): SeoMediaSlotResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}

export class SeoMediaSlotListResponseDto extends PaginationResponseDto<SeoMediaSlotResponseDto> {
  constructor(
    data: SeoMediaSlotResponseDto[],
    page: number,
    limit: number,
    total: number,
  ) {
    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasPrevious: page > 1,
      hasNext: page < Math.ceil(total / limit),
      previousPage: page > 1 ? page - 1 : undefined,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : undefined,
    }

    super(true, 'Lấy danh sách SEO media slots thành công', data, meta)
  }
}

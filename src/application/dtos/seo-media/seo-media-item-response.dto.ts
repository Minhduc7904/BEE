import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { SeoMediaItemEntity } from 'src/domain/entities'
import { toMinioPublicUrl } from 'src/shared/utils'

export class SeoMediaSlotSummaryDto {
  slotId: number
  code: string
  name: string
  isActive: boolean
}

export class SeoMediaItemResponseDto {
  itemId: number
  slotId: number
  bucketName: string
  objectKey: string
  publicUrl: string
  originalName: string
  mimeType: string
  fileSize: number
  width: number | null
  height: number | null
  sortOrder: number
  alt: string | null
  linkUrl: string | null
  createdAt: Date
  updatedAt: Date
  slot?: SeoMediaSlotSummaryDto

  static fromEntity(entity: SeoMediaItemEntity): SeoMediaItemResponseDto {
    const dto = new SeoMediaItemResponseDto()
    dto.itemId = entity.itemId
    dto.slotId = entity.slotId
    dto.bucketName = entity.bucketName
    dto.objectKey = entity.objectKey
    dto.publicUrl = toMinioPublicUrl(entity.publicUrl)
    dto.originalName = entity.originalName
    dto.mimeType = entity.mimeType
    dto.fileSize = entity.fileSize
    dto.width = entity.width
    dto.height = entity.height
    dto.sortOrder = entity.sortOrder
    dto.alt = entity.alt
    dto.linkUrl = entity.linkUrl
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    dto.slot = entity.slot
      ? {
          slotId: entity.slot.slotId,
          code: entity.slot.code,
          name: entity.slot.name,
          isActive: entity.slot.isActive,
        }
      : undefined

    return dto
  }

  static fromEntityList(entities: SeoMediaItemEntity[]): SeoMediaItemResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}

export class SeoMediaItemListResponseDto extends PaginationResponseDto<SeoMediaItemResponseDto> {
  constructor(
    data: SeoMediaItemResponseDto[],
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

    super(true, 'Lay danh sach SEO media items thanh cong', data, meta)
  }
}

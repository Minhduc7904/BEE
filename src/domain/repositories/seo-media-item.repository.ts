import { SeoMediaItemEntity } from '../entities'
import { MediaType } from 'src/shared/enums'

export interface ISeoMediaItemRepository {
  create(
    data: {
      slotId: number
      bucketName: string
      objectKey: string
      publicUrl: string
      originalName: string
      mimeType: string
      mediaType: MediaType
      fileSize: number
      width?: number | null
      height?: number | null
      duration?: number | null
      sortOrder?: number
      alt?: string | null
      linkUrl?: string | null
    },
    options?: {
      includeSlot?: boolean
    },
  ): Promise<SeoMediaItemEntity>

  findById(
    itemId: number,
    options?: {
      includeSlot?: boolean
    },
  ): Promise<SeoMediaItemEntity | null>

  findBySlotId(
    slotId: number,
    options?: {
      includeSlot?: boolean
      skip?: number
      take?: number
    },
  ): Promise<SeoMediaItemEntity[]>

  findBySlotAndObjectKey(
    slotId: number,
    objectKey: string,
    options?: {
      includeSlot?: boolean
    },
  ): Promise<SeoMediaItemEntity | null>

  update(
    itemId: number,
    data: {
      slotId?: number
      bucketName?: string
      objectKey?: string
      publicUrl?: string
      originalName?: string
      mimeType?: string
      mediaType?: MediaType
      fileSize?: number
      width?: number | null
      height?: number | null
      duration?: number | null
      sortOrder?: number
      alt?: string | null
      linkUrl?: string | null
    },
    options?: {
      includeSlot?: boolean
    },
  ): Promise<SeoMediaItemEntity>

  delete(itemId: number): Promise<void>

  deleteBySlotId(slotId: number): Promise<number>

  count(filters?: { slotId?: number; objectKey?: string }): Promise<number>
}

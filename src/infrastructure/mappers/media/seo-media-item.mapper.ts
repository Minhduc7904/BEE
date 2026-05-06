import { SeoMediaItemEntity } from '../../../domain/entities'
import { MediaMapper } from './media.mapper'
import { SeoMediaSlotMapper } from './seo-media-slot.mapper'

export class SeoMediaItemMapper {
  static toDomain(
    prismaItem: any,
    options?: {
      includeSlot?: boolean
      includeMedia?: boolean
    },
  ): SeoMediaItemEntity {
    return new SeoMediaItemEntity({
      itemId: prismaItem.itemId,
      slotId: prismaItem.slotId,
      mediaId: prismaItem.mediaId,
      sortOrder: prismaItem.sortOrder ?? 0,
      alt: prismaItem.alt ?? null,
      linkUrl: prismaItem.linkUrl ?? null,
      createdAt: prismaItem.createdAt,
      updatedAt: prismaItem.updatedAt,
      slot:
        options?.includeSlot && prismaItem.slot
          ? SeoMediaSlotMapper.toDomain(prismaItem.slot, { includeItems: false })
          : undefined,
      media:
        options?.includeMedia && prismaItem.media
          ? MediaMapper.toDomain(prismaItem.media)
          : undefined,
    })
  }

  static toDomainList(
    prismaItems: any[],
    options?: {
      includeSlot?: boolean
      includeMedia?: boolean
    },
  ): SeoMediaItemEntity[] {
    return prismaItems.map((item) => this.toDomain(item, options))
  }
}


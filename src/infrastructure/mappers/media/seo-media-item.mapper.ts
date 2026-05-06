import { SeoMediaItemEntity } from '../../../domain/entities'
import { SeoMediaSlotMapper } from './seo-media-slot.mapper'

export class SeoMediaItemMapper {
  static toDomain(
    prismaItem: any,
    options?: {
      includeSlot?: boolean
    },
  ): SeoMediaItemEntity {
    return new SeoMediaItemEntity({
      itemId: prismaItem.itemId,
      slotId: prismaItem.slotId,
      bucketName: prismaItem.bucketName,
      objectKey: prismaItem.objectKey,
      publicUrl: prismaItem.publicUrl,
      originalName: prismaItem.originalName,
      mimeType: prismaItem.mimeType,
      fileSize: Number(prismaItem.fileSize),
      width: prismaItem.width ?? null,
      height: prismaItem.height ?? null,
      sortOrder: prismaItem.sortOrder ?? 0,
      alt: prismaItem.alt ?? null,
      linkUrl: prismaItem.linkUrl ?? null,
      createdAt: prismaItem.createdAt,
      updatedAt: prismaItem.updatedAt,
      slot:
        options?.includeSlot && prismaItem.slot
          ? SeoMediaSlotMapper.toDomain(prismaItem.slot, { includeItems: false })
          : undefined,
    })
  }

  static toDomainList(
    prismaItems: any[],
    options?: {
      includeSlot?: boolean
    },
  ): SeoMediaItemEntity[] {
    return prismaItems.map((item) => this.toDomain(item, options))
  }
}

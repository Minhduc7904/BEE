import { SeoMediaSlotEntity } from '../../../domain/entities'
import { SeoMediaItemMapper } from './seo-media-item.mapper'

export class SeoMediaSlotMapper {
  static toDomain(
    prismaSlot: any,
    options?: {
      includeItems?: boolean
      includeItemMedia?: boolean
    },
  ): SeoMediaSlotEntity {
    return new SeoMediaSlotEntity({
      slotId: prismaSlot.slotId,
      code: prismaSlot.code,
      name: prismaSlot.name,
      description: prismaSlot.description ?? null,
      isActive: prismaSlot.isActive,
      createdAt: prismaSlot.createdAt,
      updatedAt: prismaSlot.updatedAt,
      items:
        options?.includeItems && prismaSlot.items
          ? SeoMediaItemMapper.toDomainList(prismaSlot.items, {
              includeSlot: false,
              includeMedia: options?.includeItemMedia ?? false,
            })
          : undefined,
    })
  }

  static toDomainList(
    prismaSlots: any[],
    options?: {
      includeItems?: boolean
      includeItemMedia?: boolean
    },
  ): SeoMediaSlotEntity[] {
    return prismaSlots.map((slot) => this.toDomain(slot, options))
  }
}


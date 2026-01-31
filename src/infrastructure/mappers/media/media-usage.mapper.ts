import { MediaUsage, Media } from '@prisma/client'
import { MediaUsageEntity } from '../../../domain/entities'
import { MediaVisibility } from 'src/shared/enums'
import { MediaMapper } from './media.mapper'

type MediaUsageWithMedia = MediaUsage & { media?: Media | null }

/**
 * MediaUsageMapper - Maps between Prisma MediaUsage and Domain MediaUsageEntity
 * 
 * Responsible for converting database models to domain entities.
 * Ensures type safety and consistent data transformation.
 */
export class MediaUsageMapper {
  /**
   * Convert Prisma MediaUsage to Domain Entity
   * 
   * @param prismaUsage - Prisma MediaUsage model
   * @returns MediaUsageEntity
   */
  static toDomain(prismaUsage: MediaUsageWithMedia): MediaUsageEntity {
    return new MediaUsageEntity({
      usageId: prismaUsage.usageId,
      mediaId: prismaUsage.mediaId,
      entityType: prismaUsage.entityType,
      entityId: prismaUsage.entityId,
      fieldName: prismaUsage.fieldName,
      usedBy: prismaUsage.usedBy,
      visibility: prismaUsage.visibility as MediaVisibility,
      createdAt: prismaUsage.createdAt,
      media: prismaUsage.media
        ? MediaMapper.toDomain(prismaUsage.media)
        : null,
    })
  }

  /**
   * Convert array of Prisma MediaUsage to array of Domain Entities
   * 
   * @param prismaUsages - Array of Prisma MediaUsage models
   * @returns Array of MediaUsageEntity
   */
  static toDomainList(prismaUsages: MediaUsageWithMedia[]): MediaUsageEntity[] {
    return prismaUsages.map((usage) => this.toDomain(usage))
  }
}

import { MediaUsage } from '@prisma/client'
import { MediaUsageEntity } from '../../domain/entities/media-usage.entity'

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
  static toDomain(prismaUsage: MediaUsage): MediaUsageEntity {
    return new MediaUsageEntity({
      usageId: prismaUsage.usageId,
      mediaId: prismaUsage.mediaId,
      entityType: prismaUsage.entityType,
      entityId: prismaUsage.entityId,
      fieldName: prismaUsage.fieldName,
      usedBy: prismaUsage.usedBy,
      visibility: prismaUsage.visibility,
      createdAt: prismaUsage.createdAt,
    })
  }

  /**
   * Convert array of Prisma MediaUsage to array of Domain Entities
   * 
   * @param prismaUsages - Array of Prisma MediaUsage models
   * @returns Array of MediaUsageEntity
   */
  static toDomainList(prismaUsages: MediaUsage[]): MediaUsageEntity[] {
    return prismaUsages.map((usage) => this.toDomain(usage))
  }
}

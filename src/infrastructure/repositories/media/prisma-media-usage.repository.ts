import { Injectable } from '@nestjs/common'
import { MediaVisibility } from 'src/shared/enums'
import { MediaUsageEntity } from '../../../domain/entities'
import { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { MediaUsageMapper } from '../../mappers/media/media-usage.mapper'

/**
 * PrismaMediaUsageRepository - Production-ready MediaUsage repository
 * 
 * PRINCIPLES:
 * - NO business logic (pure data access)
 * - NO auth/permission/visibility checks (handled at service layer)
 * - NO MinIO integration
 * - Physical delete allowed (detach usage)
 * - Transaction-safe (supports Prisma TransactionClient)
 * 
 * ARCHITECTURE:
 * - Returns MediaUsageEntity (domain layer)
 * - Uses MediaUsageMapper for conversion
 * - Type-safe with Prisma
 * - Source of truth for entity-media relationships
 */
@Injectable()
export class PrismaMediaUsageRepository implements IMediaUsageRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) { }

  /**
   * Attach media to an entity
   * Creates a new usage record
   * Unique constraint at DB level prevents duplicates
   * 
   * @param data - Media attachment data
   * @returns Created MediaUsageEntity
   */
  async attach(data: {
    mediaId: number
    entityType: string
    entityId: number
    fieldName?: string
    usedBy?: number
    visibility?: MediaVisibility
  }): Promise<MediaUsageEntity> {
    const usage = await this.prisma.mediaUsage.create({
      data: {
        mediaId: data.mediaId,
        entityType: data.entityType,
        entityId: data.entityId,
        fieldName: data.fieldName || null,
        usedBy: data.usedBy || null,
        visibility: data.visibility || MediaVisibility.PRIVATE,
      },
    })

    return MediaUsageMapper.toDomain(usage)
  }

  /**
   * Detach media usage by usage ID
   * Physical deletion of the usage record
   * 
   * @param usageId - Usage ID to detach
   */
  async detach(usageId: number): Promise<void> {
    await this.prisma.mediaUsage.delete({
      where: { usageId },
    })
  }

  /**
   * Detach all media usages for a specific entity
   * Physical deletion of matching usage records
   * Optionally filter by field name
   * 
   * @param entityType - Entity type (e.g., "USER", "COURSE")
   * @param entityId - Entity ID
   * @param fieldName - Optional field name filter
   * @returns Number of records deleted
   */
  async detachByEntity(
    entityType: string,
    entityId: number,
    fieldName?: string,
  ): Promise<number> {
    const result = await this.prisma.mediaUsage.deleteMany({
      where: {
        entityType,
        entityId,
        ...(fieldName && { fieldName }),
      },
    })

    return result.count
  }

  /**
 * Find all media usages (system-level query)
 * Supports optional filters by media, entity, field
 * NO visibility / permission logic here
 *
 * @param filter - Optional filter conditions
 * @returns Array of MediaUsageEntity
 */
  async findAll(
    filter?: {
      mediaId?: number
      entityType?: string
      entityId?: number
      fieldName?: string
    }
  ): Promise<MediaUsageEntity[]> {
    const where: Prisma.MediaUsageWhereInput = {
      ...(filter?.mediaId !== undefined && {
        mediaId: filter.mediaId,
      }),
      ...(filter?.entityType !== undefined && {
        entityType: filter.entityType,
      }),
      ...(filter?.entityId !== undefined && {
        entityId: filter.entityId,
      }),
      ...(filter?.fieldName !== undefined && {
        fieldName: filter.fieldName,
      }),
    }

    const usages = await this.prisma.mediaUsage.findMany({
      where,
      orderBy: {
        createdAt: 'desc', // admin/system view → newest first
      },
    })

    return MediaUsageMapper.toDomainList(usages)
  }

  /**
   * Find single media usage by context
   * NO visibility / permission logic here
   * 
   */
  async findOnlyByContext(
    filter: {
      mediaId?: number,
      entityType?: string,
      entityId?: number,
      fieldName?: string,
    }
  ): Promise<MediaUsageEntity | null> {
    const where: Prisma.MediaUsageWhereInput = {
      ...(filter.mediaId !== undefined && {
        mediaId: filter.mediaId,
      }),
      ...(filter.entityType !== undefined && {
        entityType: filter.entityType,
      }),
      ...(filter.entityId !== undefined && {
        entityId: filter.entityId,
      }),
      ...(filter.fieldName !== undefined && {
        fieldName: filter.fieldName,
      }),
    }
    const usage = await this.prisma.mediaUsage.findFirst({
      where,
    })
    return usage ? MediaUsageMapper.toDomain(usage) : null
  }


  /**
   * Find usage by ID
   * 
   * @param usageId - Usage ID
   * @returns MediaUsageEntity or null if not found
   */
  async findById(usageId: number): Promise<MediaUsageEntity | null> {
    const usage = await this.prisma.mediaUsage.findUnique({
      where: { usageId },
    })

    return usage ? MediaUsageMapper.toDomain(usage) : null
  }

  /**
   * Find all usages of a specific media file
   * Useful for checking where a media is used before deletion
   * 
   * @param mediaId - Media ID
   * @returns Array of MediaUsageEntity
   */
  async findByMedia(mediaId: number): Promise<MediaUsageEntity[]> {
    const usages = await this.prisma.mediaUsage.findMany({
      where: { mediaId },
      orderBy: { createdAt: 'desc' },
    })

    return MediaUsageMapper.toDomainList(usages)
  }

  /**
   * Find all media usages for a specific entity
   * Optionally filter by field name
   * Sorted by createdAt ascending (oldest first)
   * 
   * @param entityType - Entity type (e.g., "USER", "COURSE", "QUESTION")
   * @param entityId - Entity ID
   * @param fieldName - Optional field name filter (e.g., "avatar", "thumbnail")
   * @returns Array of MediaUsageEntity sorted by creation time
   */
  async findByEntity(
    entityType: string,
    entityId: number,
    fieldName?: string,
  ): Promise<MediaUsageEntity[]> {
    const usages = await this.prisma.mediaUsage.findMany({
      where: {
        entityType,
        entityId,
        ...(fieldName && { fieldName }),
      },
      include: { media: true }, // Include media for visibility checks
      orderBy: { createdAt: 'asc' }, // oldest first
    })

    return MediaUsageMapper.toDomainList(usages)
  }

  async findExistingByEntity(
    mediaIds: number[],
    entityType: string,
    entityId: number,
    fieldName?: string,
  ): Promise<MediaUsageEntity[]> {
    const usages = await this.prisma.mediaUsage.findMany({
      where: {
        mediaId: { in: mediaIds },
        entityType,
        entityId,
        ...(fieldName && { fieldName }),
      },
    })
    return MediaUsageMapper.toDomainList(usages)
  }

  /**
   * Check if a media usage exists
   * Useful for preventing duplicate attachments
   * 
   * @param mediaId - Media ID
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param fieldName - Optional field name filter
   * @returns True if usage exists
   */
  async exists(
    mediaId?: number,
    entityType?: string,
    entityId?: number,
    fieldName?: string,
  ): Promise<boolean> {
    const count = await this.prisma.mediaUsage.count({
      where: {
        mediaId,
        entityType,
        entityId,
        ...(fieldName && { fieldName }),
      },
    })

    return count > 0
  }



  /**
   * Count how many times a media file is used
   * Useful for checking if media can be safely deleted
   * 
   * @param mediaId - Media ID
   * @returns Usage count
   */
  async countByMedia(mediaId: number): Promise<number> {
    return await this.prisma.mediaUsage.count({
      where: { mediaId },
    })
  }
}

import { MediaVisibility } from '@prisma/client'
import { MediaUsageEntity } from '../entities/media-usage.entity'

/**
 * IMediaUsageRepository - Domain interface for media usage tracking
 * 
 * Pure data access contract for media attachment operations.
 * Source of truth for entity-media relationships.
 */
export interface IMediaUsageRepository {
  /**
   * Attach media to an entity
   * Creates a new usage record
   * 
   * @param data - Media attachment data
   * @returns Created MediaUsageEntity
   */
  attach(data: {
    mediaId: number
    entityType: string
    entityId: number
    fieldName?: string
    usedBy?: number
    visibility?: MediaVisibility
  }): Promise<MediaUsageEntity>

  /**
   * Detach media usage by usage ID
   * Physical deletion of the usage record
   * 
   * @param usageId - Usage ID to detach
   */
  detach(usageId: number): Promise<void>

  /**
   * Detach all media usages for a specific entity
   * Optionally filter by field name
   * 
   * @param entityType - Entity type (e.g., "USER", "COURSE")
   * @param entityId - Entity ID
   * @param fieldName - Optional field name filter
   * @returns Number of records deleted
   */
  detachByEntity(
    entityType: string,
    entityId: number,
    fieldName?: string,
  ): Promise<number>

  /**
   * Find usage by ID
   * 
   * @param usageId - Usage ID
   * @returns MediaUsageEntity or null if not found
   */
  findById(usageId: number): Promise<MediaUsageEntity | null>

  /**
   * Find all usages of a specific media file
   * 
   * @param mediaId - Media ID
   * @returns Array of MediaUsageEntity
   */
  findByMedia(mediaId: number): Promise<MediaUsageEntity[]>

  /**
   * Find all media usages for a specific entity
   * Optionally filter by field name
   * Sorted by createdAt ascending
   * 
   * @param entityType - Entity type (e.g., "USER", "COURSE")
   * @param entityId - Entity ID
   * @param fieldName - Optional field name filter
   * @returns Array of MediaUsageEntity
   */
  findByEntity(
    entityType: string,
    entityId: number,
    fieldName?: string,
  ): Promise<MediaUsageEntity[]>

  /**
   * Check if a media usage exists
   * 
   * @param mediaId - Media ID
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param fieldName - Optional field name filter
   * @returns True if usage exists
   */
  exists(
    mediaId: number,
    entityType: string,
    entityId: number,
    fieldName?: string,
  ): Promise<boolean>

  /**
   * Count how many times a media file is used
   * 
   * @param mediaId - Media ID
   * @returns Usage count
   */
  countByMedia(mediaId: number): Promise<number>
}

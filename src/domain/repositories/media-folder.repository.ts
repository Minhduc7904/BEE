import { MediaFolderEntity } from '../entities/media-folder.entity'
import { MediaType } from '@prisma/client'

/**
 * IMediaFolderRepository - Domain interface for media folder data access
 * 
 * Pure data access contract for media folder management.
 * Supports hierarchical folder structure operations.
 */
export interface IMediaFolderRepository {
  /**
   * Create a new media folder
   * 
   * @param data - Folder creation data
   * @returns Created MediaFolderEntity
   */
  create(data: {
    name: string
    slug: string
    description?: string
    parentId?: number
    createdBy?: number
  }): Promise<MediaFolderEntity>

  /**
   * Find folder by ID
   * 
   * @param folderId - Folder ID
   * @returns MediaFolderEntity or null if not found
   */
  findById(folderId: number): Promise<MediaFolderEntity | null>

  /**
   * Find folder by slug
   * 
   * @param slug - Unique folder slug
   * @returns MediaFolderEntity or null if not found
   */
  findBySlug(slug: string, parentId: number): Promise<MediaFolderEntity | null>

  /**
   * Find direct children of a folder
   * 
   * @param parentId - Parent folder ID (null for root folders)
   * @param userId - Optional user ID filter
   * @param includeMediaCount - Include media count for each folder
   * @param mediaType - Optional media type filter for count
   * @returns Array of child MediaFolderEntity
   */
  findChildren(parentId: number | null, userId?: number, includeMediaCount?: boolean, mediaType?: MediaType): Promise<MediaFolderEntity[]>

  /**
   * Find all root folders (parentId = null)
   * 
   * @returns Array of root MediaFolderEntity
   */
  findRootFolders(userId?: number): Promise<MediaFolderEntity[]>

  /**
   * Find multiple folders with optional filters
   * 
   * @param filters - Filter criteria
   * @returns Array of MediaFolderEntity
   */
  findMany(filters?: {
    parentId?: number | null
    createdBy?: number
    skip?: number
    take?: number
  }): Promise<MediaFolderEntity[]>

  /**
   * Update folder metadata
   * 
   * @param folderId - Folder ID to update
   * @param data - Update data
   * @returns Updated MediaFolderEntity
   */
  update(
    folderId: number,
    data: {
      name?: string
      slug?: string
      description?: string
      parentId?: number
    },
  ): Promise<MediaFolderEntity>

  /**
   * Delete folder
   * Cascade delete handled at database level
   * 
   * @param folderId - Folder ID to delete
   */
  delete(folderId: number): Promise<void>

  /**
   * Count folders with optional filters
   * 
   * @param filters - Filter criteria
   * @returns Total count
   */
  count(filters?: {
    parentId?: number | null
    createdBy?: number
  }): Promise<number>
}

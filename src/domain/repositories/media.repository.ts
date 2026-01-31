import { MediaEntity } from '../entities'
import { MediaType, MediaStatus } from 'src/shared/enums'

/**
 * IMediaRepository - Media domain repository interface
 * 
 * PRODUCTION PRINCIPLES:
 * - NO publicUrl in interface (URLs generated runtime)
 * - NO physical delete (only soft delete)
 * - Pure data access contract
 */
export interface IMediaRepository {
  create(data: {
    folderId?: number
    parentId?: number
    rawContent?: string
    bucketName: string
    objectKey: string
    originalFilename: string
    mimeType: string
    fileSize: number
    type: MediaType
    status: MediaStatus
    width?: number
    height?: number
    duration?: number
    uploadedBy?: number
    description?: string
    alt?: string
  }): Promise<MediaEntity>

  findById(mediaId: number): Promise<MediaEntity | null>

  findByParentId(parentId: number): Promise<MediaEntity[]>

  findMany(filters: {
    folderId?: number
    type?: MediaType
    status?: MediaStatus
    uploadedBy?: number
    bucketName?: string
    search?: string
    fromDate?: string
    toDate?: string
    includeDeleted?: boolean
    page?: number
    limit?: number
    skip?: number
    take?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<MediaEntity[]>

  update(
    mediaId: number,
    data: {
      folderId?: number
      status?: MediaStatus
      width?: number
      height?: number
      duration?: number
      description?: string
      alt?: string
      rawContent?: string
      parentId?: number
    },
  ): Promise<MediaEntity>

  /**
   * Soft delete only - NO physical deletion allowed
   * Sets status to DELETED without removing record
   */
  softDelete(mediaId: number): Promise<MediaEntity>

  hardDelete(mediaId: number): Promise<boolean>

  count(filters: {
    folderId?: number
    search?: string
    fromDate?: string
    toDate?: string
    type?: MediaType
    status?: MediaStatus
    uploadedBy?: number
    includeDeleted?: boolean
    bucketName?: string
  }): Promise<number>

  /**
   * Find media by storage location
   * Useful for duplicate checking
   */
  findByLocation(bucketName: string, objectKey: string): Promise<MediaEntity | null>

  /**
   * Batch update media status
   * For bulk operations
   */
  batchUpdateStatus(mediaIds: number[], status: MediaStatus): Promise<number>
}

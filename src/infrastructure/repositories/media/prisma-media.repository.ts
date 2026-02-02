import { Injectable } from '@nestjs/common'
import { MediaEntity } from '../../../domain/entities'
import { IMediaRepository } from '../../../domain/repositories/media.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { MediaType, MediaStatus } from 'src/shared/enums'
import { Prisma } from '@prisma/client'
import { MediaMapper } from '../../mappers/media/media.mapper'
/**
 * PrismaMediaRepository - Production-ready Media repository
 * 
 * PRINCIPLES:
 * - NO publicUrl (URLs generated runtime via presigned URLs)
 * - NO physical delete (only soft delete)
 * - NO business logic (pure data access)
 * - Transaction-safe (supports Prisma TransactionClient)
 * 
 * ARCHITECTURE:
 * - Returns MediaEntity (domain layer)
 * - Uses MediaMapper for conversion
 * - Type-safe with Prisma
 */
@Injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) { }

  /**
   * Create new media record
   * NO publicUrl - URLs generated on-demand via MinioService
   * 
   * @param data - Media creation data
   * @returns Created MediaEntity
   */
  async create(data: {
    folderId?: number
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
    rawContent?: string
    parentId?: number
  }): Promise<MediaEntity> {
    const media = await this.prisma.media.create({
      data: {
        folderId: data.folderId,
        bucketName: data.bucketName,
        objectKey: data.objectKey,
        fileName: data.originalFilename, // Use original filename as-is
        originalName: data.originalFilename,
        mimeType: data.mimeType,
        fileSize: BigInt(data.fileSize),
        type: data.type,
        status: data.status,
        width: data.width,
        height: data.height,
        duration: data.duration,
        description: data.description,
        alt: data.alt,
        uploadedBy: data.uploadedBy ?? null,
        rawContent: data.rawContent ?? null,
        parentId: data.parentId ?? null,
      },
    })

    return MediaMapper.toDomain(media)
  }

  /**
   * Find media by ID
   * 
   * @param mediaId - Media ID
   * @returns MediaEntity or null if not found
   */
  async findById(mediaId: number): Promise<MediaEntity | null> {
    const media = await this.prisma.media.findUnique({
      where: { mediaId },
      include: {
        folder: true,
        uploader: {
          select: {
            userId: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        usages: {
          select: {
            usageId: true,
            entityType: true,
            entityId: true,
            fieldName: true,
            visibility: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    return media ? MediaMapper.toDomain(media) : null
  }

  findByIds(mediaIds: number[]): Promise<MediaEntity[]> {
    return this.prisma.media.findMany({
      where: {
        mediaId: { in: mediaIds },
        status: { not: MediaStatus.DELETED }
      },
      include: {
        folder: true,
        uploader: {
          select: {
            userId: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        usages: {
          select: {
            usageId: true,
            entityType: true,
            entityId: true,
            fieldName: true,
            visibility: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    }).then(medias => MediaMapper.toDomainList(medias))
  }

  /**
   * Find all child media by parent ID
   * 
   * @param parentId - Parent media ID
   * @returns Array of child MediaEntity
   */
  async findByParentId(parentId: number): Promise<MediaEntity[]> {
    const media = await this.prisma.media.findMany({
      where: {
        parentId,
        status: { not: MediaStatus.DELETED }
      },
      orderBy: { mediaId: 'asc' }
    })

    return media.map(m => MediaMapper.toDomain(m))
  }

  /**
   * Find multiple media with filters
   * Automatically excludes DELETED status unless explicitly included
   * 
   * @param filters - Filter criteria
   * @returns Array of MediaEntity
   */
  async findMany(filters: {
    folderId?: number
    type?: MediaType
    status?: MediaStatus
    uploadedBy?: number
    bucketName?: string
    search?: string
    includeDeleted?: boolean // Explicitly include deleted items
    page?: number
    limit?: number
    skip?: number
    take?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    fromDate?: string
    toDate?: string
  }): Promise<MediaEntity[]> {
    const { skip, take, page, limit, includeDeleted, bucketName, sortBy, sortOrder, search, fromDate, toDate, uploadedBy, ...where } = filters

    // Calculate skip/take from page/limit if provided
    const actualSkip = skip ?? (page && limit ? (page - 1) * limit : 0)
    const actualTake = take ?? limit ?? 20

    // Auto-exclude DELETED unless explicitly requested
    const statusFilter = includeDeleted
      ? where.status
      : where.status || { not: MediaStatus.DELETED }

    // Build search conditions
    const searchConditions = search ? {
      OR: [
        { originalName: { contains: search } },
        { fileName: { contains: search } },
        { description: { contains: search } },
        { mimeType: { contains: search } },
      ]
    } : {}

    // Build date range conditions
    const dateConditions: any = {}
    if (fromDate) {
      dateConditions.createdAt = { ...dateConditions.createdAt, gte: new Date(fromDate) }
    }
    if (toDate) {
      dateConditions.createdAt = { ...dateConditions.createdAt, lte: new Date(toDate) }
    }

    // Build orderBy based on sortBy and sortOrder
    let orderBy: any = { createdAt: 'desc' } // Default sort
    if (sortBy) {
      switch (sortBy) {
        case 'createdAt':
        case 'uploadedAt':
          orderBy = { createdAt: sortOrder || 'desc' }
          break
        case 'fileSize':
        case 'size':
          orderBy = { fileSize: sortOrder || 'desc' }
          break
        case 'filename':
        case 'name':
          orderBy = { fileName: sortOrder || 'asc' }
          break
        default:
          orderBy = { createdAt: 'desc' }
      }
    }

    const media = await this.prisma.media.findMany({
      where: {
        ...where,
        ...dateConditions,
        ...searchConditions,
        status: statusFilter,
        uploadedBy: uploadedBy,
        ...(bucketName && { bucketName }),
      },
      skip: actualSkip,
      take: actualTake,
      orderBy,
      include: {
        folder: true,
        uploader: {
          select: {
            userId: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return MediaMapper.toDomainList(media)
  }

  /**
   * Update media metadata
   * NO publicUrl - URLs are ephemeral and generated on-demand
   * 
   * @param mediaId - Media ID to update
   * @param data - Update data
   * @returns Updated MediaEntity
   */
  async update(
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
  ): Promise<MediaEntity> {
    const media = await this.prisma.media.update({
      where: { mediaId },
      data,
    })

    return MediaMapper.toDomain(media)
  }

  /**
   * Soft delete media
   * Sets status to DELETED without removing record
   * Physical deletion handled separately by admin/cleanup job
   * 
   * @param mediaId - Media ID to soft delete
   * @returns Soft-deleted MediaEntity
   */
  async softDelete(mediaId: number): Promise<MediaEntity> {
    const media = await this.prisma.media.update({
      where: { mediaId },
      data: {
        status: MediaStatus.DELETED,
        // Note: Keep bucketName/objectKey for cleanup job
      },
    })

    return MediaMapper.toDomain(media)
  }

  async hardDelete(mediaId: number): Promise<boolean> {
    await this.prisma.media.delete({
      where: { mediaId },
    })
    return true
  }

  /**
   * Count media with filters
   * Automatically excludes DELETED status unless explicitly included
   * 
   * @param filters - Filter criteria
   * @returns Total count
   */
  async count(filters: {
    folderId?: number
    type?: MediaType
    status?: MediaStatus
    uploadedBy?: number
    bucketName?: string
    search?: string
    fromDate?: string
    toDate?: string
    includeDeleted?: boolean
  }): Promise<number> {
    const { includeDeleted, bucketName, search, fromDate, toDate, ...where } = filters

    // Auto-exclude DELETED unless explicitly requested
    const statusFilter = includeDeleted
      ? where.status
      : where.status || { not: MediaStatus.DELETED }

    // Build search conditions
    const searchConditions = search ? {
      OR: [
        { originalName: { contains: search } },
        { fileName: { contains: search } },
        { description: { contains: search } },
        { mimeType: { contains: search } },
      ]
    } : {}

    // Build date range conditions
    const dateConditions: any = {}
    if (fromDate) {
      dateConditions.createdAt = { ...dateConditions.createdAt, gte: new Date(fromDate) }
    }
    if (toDate) {
      dateConditions.createdAt = { ...dateConditions.createdAt, lte: new Date(toDate) }
    }

    return await this.prisma.media.count({
      where: {
        ...where,
        ...dateConditions,
        ...searchConditions,
        status: statusFilter,
        ...(bucketName && { bucketName }),
      },
    })
  }

  /**
   * Find media by bucket location
   * Useful for checking duplicates or finding by storage path
   * 
   * @param bucketName - Bucket name
   * @param objectKey - Object key (path)
   * @returns MediaEntity or null
   */
  async findByLocation(
    bucketName: string,
    objectKey: string,
  ): Promise<MediaEntity | null> {
    const media = await this.prisma.media.findUnique({
      where: {
        bucketName_objectKey: {
          bucketName,
          objectKey,
        },
      },
    })

    return media ? MediaMapper.toDomain(media) : null
  }

  /**
   * Batch update media status
   * Useful for bulk operations (e.g., mark uploaded files as READY)
   * 
   * @param mediaIds - Array of media IDs
   * @param status - New status
   * @returns Count of updated records
   */
  async batchUpdateStatus(
    mediaIds: number[],
    status: MediaStatus,
  ): Promise<number> {
    const result = await this.prisma.media.updateMany({
      where: {
        mediaId: { in: mediaIds },
      },
      data: { status },
    })

    return result.count
  }
}

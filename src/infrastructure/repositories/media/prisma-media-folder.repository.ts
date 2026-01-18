import { Injectable } from '@nestjs/common'
import { MediaFolderEntity } from '../../../domain/entities'
import { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { MediaFolderMapper } from '../../mappers/media/media-folder.mapper'
import { MediaType } from 'src/shared/enums'

/**
 * PrismaMediaFolderRepository - Production-ready MediaFolder repository
 *
 * PRINCIPLES:
 * - NO business logic (pure data access)
 * - NO auth/permission checks
 * - NO MinIO integration
 * - Transaction-safe (supports Prisma TransactionClient)
 *
 * ARCHITECTURE:
 * - Returns MediaFolderEntity (domain layer)
 * - Uses MediaFolderMapper for conversion
 * - Type-safe with Prisma
 * - Supports hierarchical folder structure
 */
@Injectable()
export class PrismaMediaFolderRepository implements IMediaFolderRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) { }

  /**
   * Create new media folder
   *
   * @param data - Folder creation data
   * @returns Created MediaFolderEntity
   */
  async create(data: {
    name: string
    slug: string
    description?: string
    parentId?: number
    createdBy?: number
  }): Promise<MediaFolderEntity> {
    const folder = await this.prisma.mediaFolder.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        parentId: data.parentId || null,
        createdBy: data.createdBy || null,
      },
    })

    return MediaFolderMapper.toDomain(folder)
  }

  /**
   * Find folder by ID
   *
   * @param folderId - Folder ID
   * @returns MediaFolderEntity or null if not found
   */
  async findById(folderId: number): Promise<MediaFolderEntity | null> {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { folderId },
    })

    return folder ? MediaFolderMapper.toDomain(folder) : null
  }

  /**
   * Find folder by slug
   *
   * @param slug - Unique folder slug
   * @returns MediaFolderEntity or null if not found
   */
  async findBySlug(slug: string, parentId: number): Promise<MediaFolderEntity | null> {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: {
        parentId_slug: {
          parentId,
          slug,
        },
      },
    })

    return folder ? MediaFolderMapper.toDomain(folder) : null
  }

  /**
   * Find direct children of a folder
   * Does NOT recursively fetch nested children
   *
   * @param parentId - Parent folder ID (null for root folders)
   * @param userId - Optional user ID filter
   * @param includeMediaCount - Include media count for each folder
   * @param mediaType - Optional media type filter for count
   * @returns Array of child MediaFolderEntity
   */
  async findChildren(parentId: number | null, userId?: number, includeMediaCount: boolean = false, mediaType?: MediaType): Promise<MediaFolderEntity[]> {
    const folders = await this.prisma.mediaFolder.findMany({
      where: { parentId, ...(userId ? { createdBy: userId } : {}) },
      orderBy: { name: 'asc' },
      ...(includeMediaCount && {
        include: {
          _count: {
            select: { 
              media: mediaType ? { where: { type: mediaType } } : true 
            },
          },
        },
      }),
    })

    return folders.map((folder) => {
      const entity = MediaFolderMapper.toDomain(folder)
      if (includeMediaCount && '_count' in folder) {
        entity.mediaCount = (folder as any)._count.media
      }
      return entity
    })
  }

  /**
   * Find all root folders (parentId = null)
   *
   * @returns Array of root MediaFolderEntity
   */
  async findRootFolders(): Promise<MediaFolderEntity[]> {
    return this.findChildren(null)
  }

  /**
   * Find multiple folders with optional filters
   *
   * @param filters - Filter criteria
   * @returns Array of MediaFolderEntity
   */
  async findMany(filters?: {
    parentId?: number | null
    createdBy?: number
    skip?: number
    take?: number
  }): Promise<MediaFolderEntity[]> {
    const { skip, take, ...where } = filters || {}

    const folders = await this.prisma.mediaFolder.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    })

    return MediaFolderMapper.toDomainList(folders)
  }

  /**
   * Update folder metadata
   *
   * @param folderId - Folder ID to update
   * @param data - Update data
   * @returns Updated MediaFolderEntity
   */
  async update(
    folderId: number,
    data: {
      name?: string
      slug?: string
      description?: string
      parentId?: number
    },
  ): Promise<MediaFolderEntity> {
    const folder = await this.prisma.mediaFolder.update({
      where: { folderId },
      data,
    })

    return MediaFolderMapper.toDomain(folder)
  }

  /**
   * Delete folder
   * Cascade delete to children and media handled at database level
   *
   * @param folderId - Folder ID to delete
   */
  async delete(folderId: number): Promise<void> {
    await this.prisma.mediaFolder.delete({
      where: { folderId },
    })
  }

  /**
   * Count folders with optional filters
   *
   * @param filters - Filter criteria
   * @returns Total count
   */
  async count(filters?: { parentId?: number | null; createdBy?: number }): Promise<number> {
    return await this.prisma.mediaFolder.count({
      where: filters,
    })
  }
}

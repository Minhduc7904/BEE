import { MediaFolder } from '@prisma/client'
import { MediaFolderEntity } from '../../domain/entities/media-folder.entity'

/**
 * MediaFolderMapper - Maps between Prisma MediaFolder and Domain MediaFolderEntity
 * 
 * Responsible for converting database models to domain entities.
 * Ensures type safety and consistent data transformation.
 */
export class MediaFolderMapper {
  /**
   * Convert Prisma MediaFolder to Domain Entity
   * 
   * @param prismaFolder - Prisma MediaFolder model
   * @returns MediaFolderEntity
   */
  static toDomain(prismaFolder: MediaFolder): MediaFolderEntity {
    return new MediaFolderEntity({
      folderId: prismaFolder.folderId,
      name: prismaFolder.name,
      slug: prismaFolder.slug,
      description: prismaFolder.description,
      parentId: prismaFolder.parentId,
      createdBy: prismaFolder.createdBy,
      createdAt: prismaFolder.createdAt,
      updatedAt: prismaFolder.updatedAt,
    })
  }

  /**
   * Convert array of Prisma MediaFolder to array of Domain Entities
   * 
   * @param prismaFolders - Array of Prisma MediaFolder models
   * @returns Array of MediaFolderEntity
   */
  static toDomainList(prismaFolders: MediaFolder[]): MediaFolderEntity[] {
    return prismaFolders.map((folder) => this.toDomain(folder))
  }
}

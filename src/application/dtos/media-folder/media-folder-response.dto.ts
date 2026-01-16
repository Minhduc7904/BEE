import { MediaFolderEntity } from '../../../domain/entities'

/**
 * MediaFolderResponseDto - Response DTO for MediaFolder
 */
export class MediaFolderResponseDto {
  folderId: number
  name: string
  slug: string
  description: string | null
  parentId: number | null
  createdBy: number | null
  mediaCount?: number
  createdAt: Date
  updatedAt: Date

  static fromEntity(entity: MediaFolderEntity): MediaFolderResponseDto {
    const dto = new MediaFolderResponseDto()
    dto.folderId = entity.folderId
    dto.name = entity.name
    dto.slug = entity.slug
    dto.description = entity.description
    dto.parentId = entity.parentId
    dto.createdBy = entity.createdBy
    dto.mediaCount = entity.mediaCount
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }
}

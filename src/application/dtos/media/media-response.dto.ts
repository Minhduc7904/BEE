import { MediaType, MediaStatus } from 'src/shared/enums'
import { MediaEntity } from '../../../domain/entities'
import { UserResponseDto } from '../user/user.dto'
import { MediaUsageResponseDto } from '../media-usage/media-usage-response.dto'
import { MediaFolderResponseDto } from '../media-folder'

export class MediaResponseDto {
  mediaId: number
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  type: MediaType
  status: MediaStatus
  bucketName: string
  objectKey: string
  publicUrl?: string
  width?: number
  height?: number
  duration?: number
  folderId?: number
  description?: string
  alt?: string
  uploadedBy?: number
  uploader?: UserResponseDto
  usages?: Array<MediaUsageResponseDto>
  folder?: MediaFolderResponseDto
  viewUrl?: string
  createdAt: Date
  updatedAt: Date

  static fromEntity(entity: MediaEntity): MediaResponseDto {
    const dto = new MediaResponseDto()
    dto.mediaId = entity.mediaId
    dto.fileName = entity.objectKey.split('/').pop() || entity.originalFilename // Extract filename from objectKey
    dto.originalName = entity.originalFilename
    dto.mimeType = entity.mimeType
    dto.fileSize = entity.fileSize
    dto.type = entity.type
    dto.status = entity.status
    dto.bucketName = entity.bucketName
    dto.objectKey = entity.objectKey
    dto.publicUrl = entity.publicUrl
    dto.width = entity.width
    dto.height = entity.height
    dto.duration = entity.duration
    dto.folderId = entity.folderId
    dto.description = undefined // Not in entity yet
    dto.alt = undefined // Not in entity yet
    dto.uploadedBy = entity.uploadedBy
    dto.uploader = entity.uploader ? UserResponseDto.fromUser(entity.uploader) : undefined
    dto.usages = entity.usages ? entity.usages.map((usage) => MediaUsageResponseDto.fromEntity(usage)) : undefined
    dto.folder = entity.folder ? MediaFolderResponseDto.fromEntity(entity.folder) : undefined
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }
}

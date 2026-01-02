import { MediaType, MediaStatus } from '@prisma/client'
import { MediaEntity } from '../../../domain/entities/media.entity'

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
  uploader?: {
    userId: number
    username: string
    firstName: string
    lastName: string
  }
  usages?: Array<{
    usageId: number
    entityType: string
    entityId: number
    fieldName: string | null
    visibility: string
    createdAt: Date
  }>
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
    dto.uploader = entity.uploader ? {
      userId: entity.uploader.userId,
      username: entity.uploader.username,
      firstName: entity.uploader.firstName,
      lastName: entity.uploader.lastName,
    } : undefined
    dto.usages = entity.usages
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }
}

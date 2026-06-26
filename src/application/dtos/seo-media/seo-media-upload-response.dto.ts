import { MediaType } from 'src/shared/enums'
import { toMinioPublicUrl } from 'src/shared/utils'

export class SeoMediaUploadResponseDto {
  bucketName: string
  objectKey: string
  publicUrl: string
  originalName: string
  mediaType: MediaType
  mimeType: string
  fileSize: number
  width: number | null
  height: number | null
  duration: number | null

  static fromData(data: {
    bucketName: string
    objectKey: string
    publicUrl: string
    originalName: string
    mediaType: MediaType
    mimeType: string
    fileSize: number
    width?: number
    height?: number
    duration?: number
  }): SeoMediaUploadResponseDto {
    const dto = new SeoMediaUploadResponseDto()
    dto.bucketName = data.bucketName
    dto.objectKey = data.objectKey
    dto.publicUrl = toMinioPublicUrl(data.publicUrl)
    dto.originalName = data.originalName
    dto.mediaType = data.mediaType
    dto.mimeType = data.mimeType
    dto.fileSize = data.fileSize
    dto.width = data.width ?? null
    dto.height = data.height ?? null
    dto.duration = data.duration ?? null
    return dto
  }
}

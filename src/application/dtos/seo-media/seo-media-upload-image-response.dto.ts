import { toMinioPublicUrl } from 'src/shared/utils'

export class SeoMediaUploadImageResponseDto {
  bucketName: string
  objectKey: string
  publicUrl: string
  originalName: string
  mimeType: string
  fileSize: number
  width: number | null
  height: number | null

  static fromData(data: {
    bucketName: string
    objectKey: string
    publicUrl: string
    originalName: string
    mimeType: string
    fileSize: number
    width?: number
    height?: number
  }): SeoMediaUploadImageResponseDto {
    const dto = new SeoMediaUploadImageResponseDto()
    dto.bucketName = data.bucketName
    dto.objectKey = data.objectKey
    dto.publicUrl = toMinioPublicUrl(data.publicUrl)
    dto.originalName = data.originalName
    dto.mimeType = data.mimeType
    dto.fileSize = data.fileSize
    dto.width = data.width ?? null
    dto.height = data.height ?? null
    return dto
  }
}

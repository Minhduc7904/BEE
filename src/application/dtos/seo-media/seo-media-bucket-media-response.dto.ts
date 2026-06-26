import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { MediaType } from 'src/shared/enums'
import { buildPublicObjectPath, toMinioPublicUrl } from 'src/shared/utils'

export class SeoMediaBucketMediaResponseDto {
  bucketName: string
  objectKey: string
  fileName: string
  originalName: string
  publicUrl: string
  mediaType: MediaType
  mimeType: string
  fileSize: number
  duration: number | null
  etag?: string
  lastModified?: Date

  static fromData(data: {
    bucketName: string
    objectKey: string
    fileSize?: number
    etag?: string
    lastModified?: Date
  }): SeoMediaBucketMediaResponseDto {
    const metadata = resolveSeoBucketMediaMetadata(data.objectKey)
    const dto = new SeoMediaBucketMediaResponseDto()
    dto.bucketName = data.bucketName
    dto.objectKey = data.objectKey
    dto.fileName = data.objectKey.split('/').pop() || data.objectKey
    dto.originalName = dto.fileName
    dto.publicUrl = toMinioPublicUrl(buildPublicObjectPath(data.bucketName, data.objectKey))
    dto.mediaType = metadata.mediaType
    dto.mimeType = metadata.mimeType
    dto.fileSize = data.fileSize ?? 0
    dto.duration = null
    dto.etag = data.etag
    dto.lastModified = data.lastModified
    return dto
  }
}

export class SeoMediaBucketMediaListResponseDto extends PaginationResponseDto<SeoMediaBucketMediaResponseDto> {}

export function resolveSeoBucketMediaMetadata(objectKey: string): {
  mediaType: MediaType
  mimeType: string
} {
  const extension = objectKey.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/jpeg' }
    case 'png':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/png' }
    case 'gif':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/gif' }
    case 'webp':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/webp' }
    case 'avif':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/avif' }
    case 'svg':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/svg+xml' }
    case 'bmp':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/bmp' }
    case 'ico':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/x-icon' }
    case 'tif':
    case 'tiff':
      return { mediaType: MediaType.IMAGE, mimeType: 'image/tiff' }
    case 'mp4':
      return { mediaType: MediaType.VIDEO, mimeType: 'video/mp4' }
    case 'webm':
      return { mediaType: MediaType.VIDEO, mimeType: 'video/webm' }
    case 'mov':
      return { mediaType: MediaType.VIDEO, mimeType: 'video/quicktime' }
    case 'm4v':
      return { mediaType: MediaType.VIDEO, mimeType: 'video/x-m4v' }
    case 'avi':
      return { mediaType: MediaType.VIDEO, mimeType: 'video/x-msvideo' }
    case 'mkv':
      return { mediaType: MediaType.VIDEO, mimeType: 'video/x-matroska' }
    default:
      return { mediaType: MediaType.OTHER, mimeType: 'application/octet-stream' }
  }
}

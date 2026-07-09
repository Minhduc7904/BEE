import { MediaUsageEntity } from '../../../domain/entities'
import { IsOptionalEnumValue, IsOptionalIdNumber } from '../../../shared/decorators/validate'
import { COURSE_MEDIA_FIELDS } from '../../../shared/constants'
import { MediaType, MediaVisibility } from '../../../shared/enums'
import { IsArray, IsInt, IsOptional, IsPositive } from 'class-validator'
import { MinioService } from '../../../infrastructure/services/minio.service'

export class UpdateCourseMediaDto {
  @IsOptionalIdNumber('Ảnh đại diện khóa học')
  thumbnailMediaId?: number

  @IsOptionalIdNumber('Ảnh banner khóa học')
  bannerMediaId?: number

  @IsOptionalIdNumber('Video giới thiệu khóa học')
  introVideoMediaId?: number

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  galleryMediaIds?: number[]

  @IsOptionalEnumValue(MediaVisibility, 'Độ hiển thị media')
  visibility?: MediaVisibility = MediaVisibility.PUBLIC
}

export class CourseMediaFileDto {
  usageId: number
  mediaId: number
  fieldName: string | null
  visibility: MediaVisibility
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  type: MediaType
  viewUrl?: string
  expiresAt?: Date
  expirySeconds?: number
  width?: number
  height?: number
  duration?: number
  description?: string
  alt?: string
  createdAt: Date

  static async fromUsage(
    usage: MediaUsageEntity,
    minioService: MinioService,
    expirySeconds = 3600,
  ): Promise<CourseMediaFileDto | undefined> {
    if (!usage.media) {
      return undefined
    }

    const viewUrl = await minioService.getPresignedUrl(
      usage.media.bucketName,
      usage.media.objectKey,
      expirySeconds,
    )

    const dto = new CourseMediaFileDto()
    dto.usageId = usage.usageId
    dto.mediaId = usage.mediaId
    dto.fieldName = usage.fieldName
    dto.visibility = usage.visibility
    dto.fileName = usage.media.objectKey.split('/').pop() || usage.media.originalFilename
    dto.originalName = usage.media.originalFilename
    dto.mimeType = usage.media.mimeType
    dto.fileSize = usage.media.fileSize
    dto.type = usage.media.type
    dto.viewUrl = viewUrl
    dto.expiresAt = new Date(Date.now() + expirySeconds * 1000)
    dto.expirySeconds = expirySeconds
    dto.width = usage.media.width
    dto.height = usage.media.height
    dto.duration = usage.media.duration
    dto.description = usage.media.description
    dto.alt = usage.media.alt
    dto.createdAt = usage.createdAt
    return dto
  }
}

export class CourseMediaResponseDto {
  thumbnail?: CourseMediaFileDto
  banner?: CourseMediaFileDto
  introVideo?: CourseMediaFileDto
  gallery: CourseMediaFileDto[] = []

  static async fromUsages(
    usages: MediaUsageEntity[],
    minioService: MinioService,
    expirySeconds = 3600,
  ): Promise<CourseMediaResponseDto> {
    const dto = new CourseMediaResponseDto()

    for (const usage of usages) {
      const mediaFile = await CourseMediaFileDto.fromUsage(usage, minioService, expirySeconds)
      if (!mediaFile) {
        continue
      }

      if (usage.fieldName === COURSE_MEDIA_FIELDS.THUMBNAIL) {
        dto.thumbnail = mediaFile
      }

      if (usage.fieldName === COURSE_MEDIA_FIELDS.BANNER) {
        dto.banner = mediaFile
      }

      if (usage.fieldName === COURSE_MEDIA_FIELDS.INTRO_VIDEO) {
        dto.introVideo = mediaFile
      }

      if (usage.fieldName === COURSE_MEDIA_FIELDS.GALLERY) {
        dto.gallery.push(mediaFile)
      }
    }

    return dto
  }
}

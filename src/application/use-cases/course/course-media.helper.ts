import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { CourseMediaResponseDto } from '../../dtos/course/course-media.dto'
import { CourseResponseDto } from '../../dtos/course/course.dto'
import { COURSE_MEDIA_FIELDS } from '../../../shared/constants'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { MinioService } from '../../../infrastructure/services/minio.service'

export async function attachThumbnailsToCourseResponses(
  courseResponses: CourseResponseDto[],
  mediaUsageRepository: IMediaUsageRepository,
  minioService: MinioService,
): Promise<void> {
  const courseIds = courseResponses.map((course) => course.courseId)
  if (!courseIds.length) {
    return
  }

  const usages = await mediaUsageRepository.findByEntities(
    EntityType.COURSE,
    courseIds,
    COURSE_MEDIA_FIELDS.THUMBNAIL,
  )

  const thumbnailByCourseId = new Map<number, CourseResponseDto['thumbnail']>()
  for (const usage of usages) {
    const media = (await CourseMediaResponseDto.fromUsages([usage], minioService)).thumbnail
    if (media) {
      thumbnailByCourseId.set(usage.entityId, media)
    }
  }

  for (const courseResponse of courseResponses) {
    courseResponse.thumbnail = thumbnailByCourseId.get(courseResponse.courseId)
  }
}

export async function attachMediaToCourseResponse(
  courseResponse: CourseResponseDto,
  mediaUsageRepository: IMediaUsageRepository,
  minioService: MinioService,
): Promise<void> {
  const usages = await mediaUsageRepository.findByEntity(EntityType.COURSE, courseResponse.courseId)
  const media = await CourseMediaResponseDto.fromUsages(usages, minioService)
  courseResponse.thumbnail = media.thumbnail
  courseResponse.media = media
}

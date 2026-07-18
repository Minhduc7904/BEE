import { TeacherProfileResponseDto } from 'src/application/dtos'
import type { MediaEntity } from 'src/domain/entities'
import type { IUnitOfWork } from 'src/domain/repositories'
import { MinioService } from 'src/application/interfaces'
import { TEACHER_PROFILE_MEDIA_FIELDS } from 'src/shared/constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaStatus } from 'src/shared/enums'

export const TEACHER_PROFILE_MEDIA_URL_EXPIRY_SECONDS = 3600 * 24

export async function attachProfileImageUrlToTeacherProfile(
  unitOfWork: IUnitOfWork,
  minioService: MinioService,
  item: TeacherProfileResponseDto,
): Promise<void> {
  await attachProfileImageUrlsToTeacherProfiles(unitOfWork, minioService, [item])
}

export async function attachTeacherProfileDetailMediaUrls(
  unitOfWork: IUnitOfWork,
  minioService: MinioService,
  item: TeacherProfileResponseDto,
): Promise<void> {
  await Promise.all([
    attachProfileImageUrlToTeacherProfile(unitOfWork, minioService, item),
    attachScheduleImageUrlsToTeacherProfile(unitOfWork, minioService, item),
    attachClassroomImageUrlsToTeacherProfile(unitOfWork, minioService, item),
  ])
}

export async function attachProfileImageUrlsToTeacherProfiles(
  unitOfWork: IUnitOfWork,
  minioService: MinioService,
  items: TeacherProfileResponseDto[],
): Promise<void> {
  for (const item of items) {
    item.profileImageMediaId = null
    item.profileImageUrl = null
  }

  if (!items.length) {
    return
  }

  const usages = await unitOfWork.executeInTransaction((repos) =>
    repos.mediaUsageRepository.findByEntities(
      EntityType.TEACHER_PROFILE,
      items.map((item) => item.teacherProfileId),
      TEACHER_PROFILE_MEDIA_FIELDS.PROFILE_IMAGE,
    ),
  )

  const usageByProfileId = new Map<number, (typeof usages)[number]>()
  for (const usage of usages) {
    if (!usageByProfileId.has(usage.entityId)) {
      usageByProfileId.set(usage.entityId, usage)
    }
  }

  await Promise.all(
    items.map(async (item) => {
      const usage = usageByProfileId.get(item.teacherProfileId)
      if (!usage) {
        return
      }

      item.profileImageMediaId = usage.mediaId
      item.profileImageUrl = await resolveMediaUrl(minioService, usage.media)
    }),
  )
}

export async function attachScheduleImageUrlsToTeacherProfile(
  unitOfWork: IUnitOfWork,
  minioService: MinioService,
  item: TeacherProfileResponseDto,
): Promise<void> {
  item.scheduleImageMediaIds = []
  item.scheduleImageUrls = []

  const usages = await unitOfWork.executeInTransaction((repos) =>
    repos.mediaUsageRepository.findByEntity(
      EntityType.TEACHER_PROFILE,
      item.teacherProfileId,
      TEACHER_PROFILE_MEDIA_FIELDS.SCHEDULE_IMAGE,
    ),
  )

  for (const usage of usages) {
    const url = await resolveMediaUrl(minioService, usage.media)
    if (!url) {
      continue
    }

    item.scheduleImageMediaIds.push(usage.mediaId)
    item.scheduleImageUrls.push(url)
  }
}

export async function attachClassroomImageUrlsToTeacherProfile(
  unitOfWork: IUnitOfWork,
  minioService: MinioService,
  item: TeacherProfileResponseDto,
): Promise<void> {
  item.classroomImageMediaIds = []
  item.classroomImageUrls = []

  const usages = await unitOfWork.executeInTransaction((repos) =>
    repos.mediaUsageRepository.findByEntity(
      EntityType.TEACHER_PROFILE,
      item.teacherProfileId,
      TEACHER_PROFILE_MEDIA_FIELDS.CLASSROOM_IMAGE,
    ),
  )

  for (const usage of usages) {
    const url = await resolveMediaUrl(minioService, usage.media)
    if (!url) {
      continue
    }

    item.classroomImageMediaIds.push(usage.mediaId)
    item.classroomImageUrls.push(url)
  }
}

async function resolveMediaUrl(
  minioService: MinioService,
  media: MediaEntity | null,
): Promise<string | null> {
  if (!media || media.status !== MediaStatus.READY) {
    return null
  }

  try {
    return (
      media.publicUrl ||
      (await minioService.getPresignedUrl(
        media.bucketName,
        media.objectKey,
        TEACHER_PROFILE_MEDIA_URL_EXPIRY_SECONDS,
      ))
    )
  } catch {
    return null
  }
}

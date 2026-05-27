import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TeacherProfileResponseDto, UpdateTeacherProfileDto } from 'src/application/dtos'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { TEACHER_PROFILE_MEDIA_FIELDS } from 'src/shared/constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaStatus, MediaType, MediaVisibility } from 'src/shared/enums'
import { ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { attachTeacherProfileDetailMediaUrls } from './teacher-profile-media.util'
import { generateUniqueTeacherProfileSlug } from './teacher-profile-slug.util'

@Injectable()
export class UpdateTeacherProfileUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    teacherProfileId: number,
    dto: UpdateTeacherProfileDto,
    userId?: number,
  ): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    const teacherProfile = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.teacherProfileRepository.findById(teacherProfileId)
      if (!existing) {
        throw new NotFoundException('Khong tim thay ho so giao vien')
      }

      const {
        profileImageMediaId,
        scheduleImageMediaIds,
        classroomImageMediaIds,
        ...dtoUpdateData
      } = dto
      const updateData: any = dtoUpdateData

      if (dto.displayName && dto.displayName !== existing.displayName) {
        updateData.slug = await generateUniqueTeacherProfileSlug(
          dto.displayName,
          repos.teacherProfileRepository,
          existing.teacherProfileId,
          existing.slug,
        )
      }

      if (profileImageMediaId !== undefined) {
        await this.updateProfileImage(repos, teacherProfileId, profileImageMediaId, userId)
      }

      if (scheduleImageMediaIds !== undefined) {
        await this.syncImageUsages(
          repos,
          teacherProfileId,
          scheduleImageMediaIds,
          TEACHER_PROFILE_MEDIA_FIELDS.SCHEDULE_IMAGE,
          'anh lich hoc',
          userId,
        )
      }

      if (classroomImageMediaIds !== undefined) {
        await this.syncImageUsages(
          repos,
          teacherProfileId,
          classroomImageMediaIds,
          TEACHER_PROFILE_MEDIA_FIELDS.CLASSROOM_IMAGE,
          'anh lop hoc',
          userId,
        )
      }

      return repos.teacherProfileRepository.update(teacherProfileId, {
        ...updateData,
        updatedBy: userId ?? null,
      })
    })

    const response = TeacherProfileResponseDto.fromEntity(teacherProfile)
    await attachTeacherProfileDetailMediaUrls(this.unitOfWork, this.minioService, response)

    return BaseResponseDto.success(
      'Cap nhat ho so giao vien thanh cong',
      response,
    )
  }

  private async updateProfileImage(
    repos: UnitOfWorkRepos,
    teacherProfileId: number,
    profileImageMediaId: number,
    userId?: number,
  ): Promise<void> {
    const profileImage = await repos.mediaRepository.findById(profileImageMediaId)
    if (!profileImage) {
      throw new NotFoundException(`Khong tim thay media anh dai dien ${profileImageMediaId}`)
    }

    if (profileImage.status !== MediaStatus.READY || profileImage.type !== MediaType.IMAGE) {
      throw new ConflictException('Media anh dai dien giao vien khong hop le')
    }

    const currentProfileImageUsage = await repos.mediaUsageRepository.findOnlyByContext({
      entityType: EntityType.TEACHER_PROFILE,
      entityId: teacherProfileId,
      fieldName: TEACHER_PROFILE_MEDIA_FIELDS.PROFILE_IMAGE,
    })

    if (currentProfileImageUsage?.mediaId === profileImageMediaId) {
      return
    }

    if (currentProfileImageUsage) {
      await repos.mediaUsageRepository.detach(currentProfileImageUsage.usageId)

      const remainingUsages = await repos.mediaUsageRepository.findByMedia(currentProfileImageUsage.mediaId)
      if (remainingUsages.length === 0) {
        await repos.mediaRepository.softDelete(currentProfileImageUsage.mediaId)
      }
    }

    await repos.mediaUsageRepository.attach({
      mediaId: profileImageMediaId,
      entityType: EntityType.TEACHER_PROFILE,
      entityId: teacherProfileId,
      fieldName: TEACHER_PROFILE_MEDIA_FIELDS.PROFILE_IMAGE,
      usedBy: userId,
      visibility: MediaVisibility.PUBLIC,
    })
  }

  private async syncImageUsages(
    repos: UnitOfWorkRepos,
    teacherProfileId: number,
    imageMediaIds: number[],
    fieldName: string,
    label: string,
    userId?: number,
  ): Promise<void> {
    const uniqueImageMediaIds = this.uniqueMediaIds(imageMediaIds)

    if (uniqueImageMediaIds.length > 0) {
      await this.assertImageMedias(repos, uniqueImageMediaIds, label)
    }

    const currentUsages = await repos.mediaUsageRepository.findByEntity(
      EntityType.TEACHER_PROFILE,
      teacherProfileId,
      fieldName,
    )
    const newMediaIdSet = new Set(uniqueImageMediaIds)
    const detachedMediaIds = new Set<number>()

    for (const usage of currentUsages) {
      await repos.mediaUsageRepository.detach(usage.usageId)
      if (!newMediaIdSet.has(usage.mediaId)) {
        detachedMediaIds.add(usage.mediaId)
      }
    }

    for (const mediaId of uniqueImageMediaIds) {
      await repos.mediaUsageRepository.attach({
        mediaId,
        entityType: EntityType.TEACHER_PROFILE,
        entityId: teacherProfileId,
        fieldName,
        usedBy: userId,
        visibility: MediaVisibility.PUBLIC,
      })
    }

    for (const mediaId of detachedMediaIds) {
      const remainingUsages = await repos.mediaUsageRepository.findByMedia(mediaId)
      if (remainingUsages.length === 0) {
        await repos.mediaRepository.softDelete(mediaId)
      }
    }
  }

  private async assertImageMedias(
    repos: UnitOfWorkRepos,
    mediaIds: number[],
    label: string,
  ): Promise<void> {
    const medias = await repos.mediaRepository.findByIds(mediaIds)
    const mediaById = new Map(medias.map((media) => [media.mediaId, media]))

    const missingMediaId = mediaIds.find((mediaId) => !mediaById.has(mediaId))
    if (missingMediaId !== undefined) {
      throw new NotFoundException(`Khong tim thay media ${label} ${missingMediaId}`)
    }

    const invalidMedia = medias.find(
      (media) => media.status !== MediaStatus.READY || media.type !== MediaType.IMAGE,
    )
    if (invalidMedia) {
      throw new ConflictException(`Media ${label} giao vien khong hop le`)
    }
  }

  private uniqueMediaIds(mediaIds?: number[]): number[] {
    return Array.from(new Set(mediaIds || []))
  }
}

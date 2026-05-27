import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, CreateTeacherProfileDto, TeacherProfileResponseDto } from 'src/application/dtos'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { TeacherProfileSeoAiService } from 'src/infrastructure/services'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { TEACHER_PROFILE_MEDIA_FIELDS } from 'src/shared/constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaStatus, MediaType, MediaVisibility } from 'src/shared/enums'
import { ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { generateUniqueTeacherProfileSlug } from './teacher-profile-slug.util'
import { attachTeacherProfileDetailMediaUrls } from './teacher-profile-media.util'

@Injectable()
export class CreateTeacherProfileUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly teacherProfileSeoAiService: TeacherProfileSeoAiService,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    dto: CreateTeacherProfileDto,
    userId?: number,
  ): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    const seoFields = this.shouldGenerateSeo(dto)
      ? await this.teacherProfileSeoAiService.generate({
          displayName: dto.displayName,
          headline: dto.headline,
          shortDescription: dto.shortDescription,
          bio: dto.bio,
          expertise: dto.expertise,
          teachingSubjects: dto.teachingSubjects,
          gradeLevels: dto.gradeLevels,
          teachingFormats: dto.teachingFormats,
          teachingMethods: dto.teachingMethods,
          yearsExperience: dto.yearsExperience,
          education: dto.education,
          certifications: dto.certifications,
          achievements: dto.achievements,
          teachingArea: dto.teachingArea,
          workplace: dto.workplace,
        })
      : null

    const teacherProfile = await this.unitOfWork.executeInTransaction(async (repos) => {
      const {
        slug: inputSlug,
        profileImageMediaId,
        scheduleImageMediaIds,
        classroomImageMediaIds,
        ...createData
      } = dto
      const uniqueScheduleImageMediaIds = this.uniqueMediaIds(scheduleImageMediaIds)
      const uniqueClassroomImageMediaIds = this.uniqueMediaIds(classroomImageMediaIds)
      const slug = await generateUniqueTeacherProfileSlug(
        inputSlug || dto.displayName,
        repos.teacherProfileRepository,
      )

      if (profileImageMediaId !== undefined) {
        await this.assertProfileImageMedia(repos, profileImageMediaId)
      }

      if (uniqueScheduleImageMediaIds.length > 0) {
        await this.assertImageMedias(repos, uniqueScheduleImageMediaIds, 'anh lich hoc')
      }

      if (uniqueClassroomImageMediaIds.length > 0) {
        await this.assertImageMedias(repos, uniqueClassroomImageMediaIds, 'anh lop hoc')
      }

      const teacherProfile = await repos.teacherProfileRepository.create({
        ...createData,
        targetKeyword: dto.targetKeyword || seoFields?.targetKeyword,
        keywordText: dto.keywordText || seoFields?.keywordText,
        metaTitle: dto.metaTitle || seoFields?.metaTitle,
        metaDescription: dto.metaDescription || seoFields?.metaDescription,
        ogTitle: dto.ogTitle || seoFields?.ogTitle,
        ogDescription: dto.ogDescription || seoFields?.ogDescription,
        searchIntent: dto.searchIntent || seoFields?.searchIntent,
        slug,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })

      if (profileImageMediaId !== undefined) {
        await repos.mediaUsageRepository.attach({
          mediaId: profileImageMediaId,
          entityType: EntityType.TEACHER_PROFILE,
          entityId: teacherProfile.teacherProfileId,
          fieldName: TEACHER_PROFILE_MEDIA_FIELDS.PROFILE_IMAGE,
          usedBy: userId,
          visibility: MediaVisibility.PUBLIC,
        })
      }

      for (const mediaId of uniqueScheduleImageMediaIds) {
        await repos.mediaUsageRepository.attach({
          mediaId,
          entityType: EntityType.TEACHER_PROFILE,
          entityId: teacherProfile.teacherProfileId,
          fieldName: TEACHER_PROFILE_MEDIA_FIELDS.SCHEDULE_IMAGE,
          usedBy: userId,
          visibility: MediaVisibility.PUBLIC,
        })
      }

      for (const mediaId of uniqueClassroomImageMediaIds) {
        await repos.mediaUsageRepository.attach({
          mediaId,
          entityType: EntityType.TEACHER_PROFILE,
          entityId: teacherProfile.teacherProfileId,
          fieldName: TEACHER_PROFILE_MEDIA_FIELDS.CLASSROOM_IMAGE,
          usedBy: userId,
          visibility: MediaVisibility.PUBLIC,
        })
      }

      return teacherProfile
    })

    const response = TeacherProfileResponseDto.fromEntity(teacherProfile)
    await attachTeacherProfileDetailMediaUrls(this.unitOfWork, this.minioService, response)

    return BaseResponseDto.success(
      'Tao ho so giao vien thanh cong',
      response,
    )
  }

  private async assertProfileImageMedia(
    repos: UnitOfWorkRepos,
    profileImageMediaId: number,
  ): Promise<void> {
    const profileImage = await repos.mediaRepository.findById(profileImageMediaId)
    if (!profileImage) {
      throw new NotFoundException(`Khong tim thay media anh dai dien ${profileImageMediaId}`)
    }

    if (profileImage.status !== MediaStatus.READY || profileImage.type !== MediaType.IMAGE) {
      throw new ConflictException('Media anh dai dien giao vien khong hop le')
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

  private shouldGenerateSeo(dto: CreateTeacherProfileDto): boolean {
    return (
      !dto.targetKeyword ||
      !dto.keywordText ||
      !dto.metaTitle ||
      !dto.metaDescription ||
      !dto.ogTitle ||
      !dto.ogDescription ||
      !dto.searchIntent
    )
  }
}

import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository, IMediaRepository } from '../../../domain/repositories'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseMediaResponseDto, UpdateCourseMediaDto } from '../../dtos/course/course-media.dto'
import { BusinessLogicException, NotFoundException, ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { COURSE_MEDIA_FIELDS, CourseMediaField } from '../../../shared/constants'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { MediaStatus, MediaType, MediaVisibility } from '../../../shared/enums'
import { MinioService } from '../../../infrastructure/services/minio.service'

@Injectable()
export class UpdateCourseMediaUseCase {
  constructor(
    @Inject('ICourseRepository')
    private readonly courseRepository: ICourseRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(courseId: number, dto: UpdateCourseMediaDto, userId?: number): Promise<BaseResponseDto<CourseMediaResponseDto>> {
    const course = await this.courseRepository.findById(courseId)
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học')
    }

    const visibility = dto.visibility ?? MediaVisibility.PUBLIC
    const hasAnyInput =
      dto.thumbnailMediaId !== undefined
      || dto.bannerMediaId !== undefined
      || dto.introVideoMediaId !== undefined
      || dto.galleryMediaIds !== undefined

    if (!hasAnyInput) {
      throw new ValidationException('Cần truyền ít nhất một media để cập nhật cho khóa học')
    }

    await this.validateMedia(dto.thumbnailMediaId, MediaType.IMAGE, 'Ảnh đại diện khóa học')
    await this.validateMedia(dto.bannerMediaId, MediaType.IMAGE, 'Ảnh banner khóa học')
    await this.validateMedia(dto.introVideoMediaId, MediaType.VIDEO, 'Video giới thiệu khóa học')

    const galleryMediaIds = dto.galleryMediaIds ? [...new Set(dto.galleryMediaIds)] : undefined
    if (galleryMediaIds) {
      for (const galleryMediaId of galleryMediaIds) {
        await this.validateMedia(galleryMediaId, MediaType.IMAGE, 'Ảnh thư viện khóa học')
      }
    }

    await this.replaceSingleMedia(courseId, COURSE_MEDIA_FIELDS.THUMBNAIL, dto.thumbnailMediaId, visibility, userId)
    await this.replaceSingleMedia(courseId, COURSE_MEDIA_FIELDS.BANNER, dto.bannerMediaId, visibility, userId)
    await this.replaceSingleMedia(courseId, COURSE_MEDIA_FIELDS.INTRO_VIDEO, dto.introVideoMediaId, visibility, userId)

    if (galleryMediaIds !== undefined) {
      await this.mediaUsageRepository.detachByEntity(EntityType.COURSE, courseId, COURSE_MEDIA_FIELDS.GALLERY)
      for (const galleryMediaId of galleryMediaIds) {
        await this.mediaUsageRepository.attach({
          mediaId: galleryMediaId,
          entityType: EntityType.COURSE,
          entityId: courseId,
          fieldName: COURSE_MEDIA_FIELDS.GALLERY,
          usedBy: userId,
          visibility,
        })
      }
    }

    const usages = await this.mediaUsageRepository.findByEntity(EntityType.COURSE, courseId)
    return BaseResponseDto.success(
      'Cập nhật media khóa học thành công',
      await CourseMediaResponseDto.fromUsages(usages, this.minioService),
    )
  }

  private async validateMedia(mediaId: number | undefined, expectedType: MediaType, label: string): Promise<void> {
    if (mediaId === undefined) {
      return
    }

    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException(`${label} không tồn tại`)
    }

    if (media.status !== MediaStatus.READY) {
      throw new BusinessLogicException(`${label} chưa sẵn sàng để sử dụng`)
    }

    if (media.type !== expectedType) {
      throw new BusinessLogicException(`${label} phải là media loại ${expectedType}`)
    }
  }

  private async replaceSingleMedia(
    courseId: number,
    fieldName: CourseMediaField,
    mediaId: number | undefined,
    visibility: MediaVisibility,
    userId?: number,
  ): Promise<void> {
    if (mediaId === undefined) {
      return
    }

    await this.mediaUsageRepository.detachByEntity(EntityType.COURSE, courseId, fieldName)
    await this.mediaUsageRepository.attach({
      mediaId,
      entityType: EntityType.COURSE,
      entityId: courseId,
      fieldName,
      usedBy: userId,
      visibility,
    })
  }
}

import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { HomeworkContentType } from 'src/shared/enums'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { HOMEWORK_SUBMIT_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'
import {
  ConflictException,
  NotFoundException,
} from 'src/shared/exceptions/custom-exceptions'
import { UpdateHomeworkSubmitImageAltDto } from '../../dtos/homeworkSubmit/update-homework-submit-image-alt.dto'
import { MediaResponseDto } from '../../dtos/media/media-response.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class UpdateHomeworkSubmitImageAltUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    homeworkSubmitId: number,
    mediaId: number,
    dto: UpdateHomeworkSubmitImageAltDto,
    adminId: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const homeworkSubmit = await repos.homeworkSubmitRepository.findById(homeworkSubmitId)
      if (!homeworkSubmit || !homeworkSubmit.homeworkContent) {
        throw new NotFoundException('Không tìm thấy bài nộp bài tập')
      }

      if (homeworkSubmit.homeworkContent.type !== HomeworkContentType.FILE_UPLOAD) {
        throw new ConflictException('Chỉ có thể cập nhật nhận xét ảnh cho bài tập FILE_UPLOAD')
      }

      const usage = await repos.mediaUsageRepository.findOnlyByContext({
        mediaId,
        entityType: EntityType.HOMEWORK_SUBMIT,
        entityId: homeworkSubmitId,
        fieldName: HOMEWORK_SUBMIT_MEDIA_FIELDS.ATTACHMENTS,
      })
      if (!usage) {
        throw new NotFoundException('Ảnh không thuộc bài nộp này')
      }

      const media = await repos.mediaRepository.findById(mediaId)
      if (!media) {
        throw new NotFoundException('Không tìm thấy file đính kèm')
      }

      const updatedMedia = await repos.mediaRepository.update(mediaId, {
        alt: dto.alt,
      })

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.HOMEWORK_SUBMIT.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.HOMEWORK_SUBMIT,
        resourceId: homeworkSubmitId.toString(),
        beforeData: { mediaId, alt: media.alt },
        afterData: { mediaId, alt: updatedMedia.alt },
      })

      return MediaResponseDto.fromEntity(updatedMedia)
    })

    return BaseResponseDto.success('Cập nhật nhận xét ảnh thành công', result)
  }
}

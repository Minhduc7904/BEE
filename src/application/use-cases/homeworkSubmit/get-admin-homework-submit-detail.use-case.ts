import { Inject, Injectable } from '@nestjs/common'
import type {
  IHomeworkSubmitRepository,
  IMediaUsageRepository,
} from 'src/domain/repositories'
import { HomeworkContentType } from 'src/shared/enums'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { HOMEWORK_SUBMIT_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { AdminHomeworkSubmitDetailDto } from '../../dtos/homeworkSubmit/admin-homework-submit-detail.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { MediaUsageResponseDto } from '../../dtos/media-usage/media-usage-response.dto'
import { GetAdminCompetitionSubmitDetailUseCase } from '../competition-submit/get-admin-competition-submit-detail.use-case'
import { GetAdminMediaViewUrlUseCase } from '../media/get-admin-media-view-url.use-case'

@Injectable()
export class GetAdminHomeworkSubmitDetailUseCase {
  constructor(
    @Inject('IHomeworkSubmitRepository')
    private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly getAdminCompetitionSubmitDetailUseCase: GetAdminCompetitionSubmitDetailUseCase,
    private readonly getAdminMediaViewUrlUseCase: GetAdminMediaViewUrlUseCase,
  ) {}

  async execute(
    homeworkSubmitId: number,
  ): Promise<BaseResponseDto<AdminHomeworkSubmitDetailDto>> {
    const homeworkSubmit = await this.homeworkSubmitRepository.findById(homeworkSubmitId)
    if (!homeworkSubmit || !homeworkSubmit.homeworkContent) {
      throw new NotFoundException('Không tìm thấy bài nộp bài tập')
    }

    const type = homeworkSubmit.homeworkContent.type
    const detail = new AdminHomeworkSubmitDetailDto()
    detail.type = type
    detail.homeworkSubmit = HomeworkSubmitResponseDto.fromEntity(homeworkSubmit)

    if (type === HomeworkContentType.FILE_UPLOAD) {
      const usages = await this.mediaUsageRepository.findByEntity(
        EntityType.HOMEWORK_SUBMIT,
        homeworkSubmit.homeworkSubmitId,
        HOMEWORK_SUBMIT_MEDIA_FIELDS.ATTACHMENTS,
      )
      const attachments = usages.map(MediaUsageResponseDto.fromEntity)

      await Promise.all(
        attachments.map(async (attachment) => {
          if (!attachment.media) return
          const mediaView = await this.getAdminMediaViewUrlUseCase.execute({
            mediaId: attachment.mediaId,
          })
          attachment.media.viewUrl = mediaView.data?.viewUrl
        }),
      )

      detail.homeworkSubmit = HomeworkSubmitResponseDto.fromEntity(
        homeworkSubmit,
        usages,
      )
      detail.fileSubmission = { attachments }
    }

    if (type === HomeworkContentType.COMPETITION) {
      detail.competitionSubmission = homeworkSubmit.competitionSubmitId
        ? (await this.getAdminCompetitionSubmitDetailUseCase.execute(
            homeworkSubmit.competitionSubmitId,
          )).data ?? null
        : null
    }

    return BaseResponseDto.success('Lấy chi tiết bài nộp bài tập thành công', detail)
  }
}

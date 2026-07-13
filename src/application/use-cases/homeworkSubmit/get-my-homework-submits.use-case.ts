import { Inject, Injectable } from '@nestjs/common'
import type {
  IHomeworkSubmitRepository,
  IMediaUsageRepository,
} from 'src/domain/repositories'
import { HomeworkSubmitListQueryDto } from '../../dtos/homeworkSubmit/homework-submit-list-query.dto'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { HOMEWORK_SUBMIT_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'
import { GetMyMediaViewUrlUseCase } from '../media/get-my-media-view-url.use-case'

@Injectable()
export class GetMyHomeworkSubmitsUseCase {
  constructor(
    @Inject('IHomeworkSubmitRepository')
    private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly getMyMediaViewUrlUseCase: GetMyMediaViewUrlUseCase,
  ) {}

  async execute(
    studentId: number,
    userId: number,
    query: HomeworkSubmitListQueryDto,
  ): Promise<BaseResponseDto<{
    homeworkSubmits: HomeworkSubmitResponseDto[]
    pagination: { total: number; page: number; limit: number; totalPages: number }
  }>> {
    const result = await this.homeworkSubmitRepository.findAllWithPagination(
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      {
        homeworkContentId: query.homeworkContentId,
        studentId,
        graderId: query.graderId,
        isGraded: query.isGraded,
        search: query.search,
      },
    )

    const submitIds = result.homeworkSubmits.map((submit) => submit.homeworkSubmitId)
    const usages = await this.mediaUsageRepository.findByEntities(
      EntityType.HOMEWORK_SUBMIT,
      submitIds,
      HOMEWORK_SUBMIT_MEDIA_FIELDS.ATTACHMENTS,
    )
    const usagesBySubmitId = new Map<number, typeof usages>()
    for (const usage of usages) {
      const existing = usagesBySubmitId.get(usage.entityId) ?? []
      existing.push(usage)
      usagesBySubmitId.set(usage.entityId, existing)
    }

    const homeworkSubmits = await Promise.all(
      result.homeworkSubmits.map(async (submit) => {
        const attachments = usagesBySubmitId.get(submit.homeworkSubmitId) ?? []
        const dto = HomeworkSubmitResponseDto.fromEntity(submit, attachments)

        await Promise.all(
          (dto.attachments ?? []).map(async (attachment) => {
            if (!attachment.media || attachment.media.uploadedBy !== userId) return
            const mediaView = await this.getMyMediaViewUrlUseCase.execute({
              mediaId: attachment.mediaId,
              userId,
            })
            attachment.media.viewUrl = mediaView.data?.viewUrl
          }),
        )

        return dto
      }),
    )

    return BaseResponseDto.success('Lấy danh sách bài nộp của bạn thành công', {
      homeworkSubmits,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    })
  }
}

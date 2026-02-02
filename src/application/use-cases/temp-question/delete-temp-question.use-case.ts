// src/application/use-cases/temp-question/delete-temp-question.use-case.ts
import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common'
import type {
  IUnitOfWork,
  IMediaRepository,
  IMediaUsageRepository,
} from '../../../domain/repositories'
import type {
  ITempQuestionRepository,
} from '../../../domain/repositories/temp-question.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { extractAllMediaIds } from '../../../shared/utils'

@Injectable()
export class DeleteTempQuestionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) { }

  async execute(
    tempQuestionId: number,
  ): Promise<BaseResponseDto<boolean>> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const tempQuestionRepository: ITempQuestionRepository =
        repos.tempQuestionRepository
      const mediaUsageRepository: IMediaUsageRepository =
        repos.mediaUsageRepository

      /* ------------------------------------------------------------------
       * 1. Find TempQuestion
       * ------------------------------------------------------------------ */
      const tempQuestion = await tempQuestionRepository.findById(tempQuestionId)
      if (!tempQuestion) {
        throw new NotFoundException(
          `TempQuestion ${tempQuestionId} không tồn tại`,
        )
      }

      /* ------------------------------------------------------------------
       * 2. Extract ALL media IDs from question (content + solution)
       * ------------------------------------------------------------------ */
      const mediaIds = this.extractMediaIds(
        tempQuestion.content,
        tempQuestion.solution,
      )

      /* ------------------------------------------------------------------
       * 3. Detach media usages & soft delete media if unused
       * ------------------------------------------------------------------ */
      await this.detachAllMediaOfQuestion(
        [...mediaIds],
        tempQuestionId,
        mediaUsageRepository,
      )

      /* ------------------------------------------------------------------
       * 4. Delete TempQuestion (cascade TempStatement)
       * ------------------------------------------------------------------ */
      const deletedOrder = tempQuestion.order
      const sessionId = tempQuestion.sessionId
      await tempQuestionRepository.delete(tempQuestionId)

      /* ------------------------------------------------------------------
       * 5. Reorder remaining questions in session
       * ------------------------------------------------------------------ */
      const remainingQuestions = await tempQuestionRepository.findBySessionId(sessionId)
      
      // Update order for questions that had order > deletedOrder
      const questionsToUpdate = remainingQuestions.filter(q => q.order > deletedOrder)
      for (const question of questionsToUpdate) {
        await tempQuestionRepository.update(question.tempQuestionId, {
          order: question.order - 1
        })
      }

      /* ------------------------------------------------------------------
       * 6. Response
       * ------------------------------------------------------------------ */
      return {
        success: true,
        message: 'Xóa câu hỏi tạm thời thành công',
        data: true,
      }
    })
  }

  /* ======================================================================
   * Helper methods
   * ====================================================================== */

  private extractMediaIds(
    ...contents: Array<string | null | undefined>
  ): Set<number> {
    const ids = new Set<number>()
    contents.forEach((content) => {
      if (!content) return
      extractAllMediaIds(content).forEach((id) => ids.add(id))
    })
    return ids
  }

  private async detachAllMediaOfQuestion(
    mediaIds: number[],
    tempQuestionId: number,
    mediaUsageRepository: IMediaUsageRepository,
  ) {
    for (const mediaId of mediaIds) {
      const usages = await mediaUsageRepository.findByMedia(mediaId)

      const questionUsage = usages.find(
        (u) =>
          u.entityType === EntityType.TEMP_QUESTION &&
          u.entityId === tempQuestionId,
      )

      if (questionUsage) {
        await mediaUsageRepository.detach(questionUsage.usageId)
      }

      // Nếu TempQuestion là usage cuối cùng → soft delete media
      if (usages.length === 1 && questionUsage) {
        await this.mediaRepository.softDelete(mediaId)
      }
    }
  }
}

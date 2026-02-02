// src/application/use-cases/temp-question/update-temp-question.use-case.ts
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
import {
  ITempQuestionRepository,
} from '../../../domain/repositories/temp-question.repository'
import {
  UpdateTempQuestionDto,
  TempQuestionResponseDto,
} from '../../dtos/temp-question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import {
  extractAllMediaIds,
  normalizeMediaMarkdown,
} from '../../../shared/utils'

@Injectable()
export class UpdateTempQuestionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) { }

  async execute(
    tempQuestionId: number,
    dto: UpdateTempQuestionDto,
    userId: number,
  ): Promise<BaseResponseDto<TempQuestionResponseDto>> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const tempQuestionRepository: ITempQuestionRepository =
        repos.tempQuestionRepository
      const mediaUsageRepository: IMediaUsageRepository =
        repos.mediaUsageRepository

      /* ------------------------------------------------------------------
       * 1. Find existing TempQuestion
       * ------------------------------------------------------------------ */
      const existing = await tempQuestionRepository.findById(tempQuestionId)
      if (!existing) {
        throw new NotFoundException(
          `TempQuestion ${tempQuestionId} không tồn tại`,
        )
      }

      /* ------------------------------------------------------------------
       * 2. Normalize markdown
       * ------------------------------------------------------------------ */
      const normalizedContent =
        dto.content != null
          ? normalizeMediaMarkdown(dto.content)
          : dto.content

      const normalizedSolution =
        dto.solution != null
          ? normalizeMediaMarkdown(dto.solution)
          : dto.solution

      /* ------------------------------------------------------------------
       * 3. Extract OLD & NEW media IDs
       * ------------------------------------------------------------------ */
      const oldMediaIds = this.extractMediaIds(
        existing.content,
        existing.solution,
      )

      const newMediaIds = this.extractMediaIds(
        normalizedContent,
        normalizedSolution,
      )

      const addedMediaIds = [...newMediaIds].filter(
        (id) => !oldMediaIds.has(id),
      )

      const removedMediaIds = [...oldMediaIds].filter(
        (id) => !newMediaIds.has(id),
      )

      /* ------------------------------------------------------------------
       * 4. Attach NEW media (batch)
       * ------------------------------------------------------------------ */
      await this.attachNewMedia(
        addedMediaIds,
        tempQuestionId,
        userId,
        mediaUsageRepository,
      )

      /* ------------------------------------------------------------------
       * 5. Detach REMOVED media + soft delete if unused
       * ------------------------------------------------------------------ */
      await this.detachRemovedMedia(
        removedMediaIds,
        tempQuestionId,
        mediaUsageRepository,
      )
      /* ------------------------------------------------------------------
       * 6. Update TempQuestion
       * ------------------------------------------------------------------ */
      const updated = await tempQuestionRepository.update(tempQuestionId, {
        tempSectionId: dto.tempSectionId,
        content: normalizedContent,
        type: dto.type,
        correctAnswer: dto.correctAnswer,
        solution: normalizedSolution,
        difficulty: dto.difficulty,
        solutionYoutubeUrl: dto.solutionYoutubeUrl,
        grade: dto.grade,
        subjectId: dto.subjectId,
        pointsOrigin: dto.pointsOrigin,
        metadata: dto.metadata,
      })
      // console.log('DTO:', dto);
      // console.log('Updated TempQuestion:', updated);

      /* ------------------------------------------------------------------
       * 7. Response
       * ------------------------------------------------------------------ */
      return {
        success: true,
        message: 'Cập nhật câu hỏi tạm thời thành công',
        data: TempQuestionResponseDto.fromEntity(updated),
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

  private async attachNewMedia(
    mediaIds: number[],
    tempQuestionId: number,
    userId: number,
    mediaUsageRepository: IMediaUsageRepository,
  ) {
    if (!mediaIds.length) return

    const medias = await this.mediaRepository.findByIds(mediaIds)

    const existingUsages =
      await mediaUsageRepository.findExistingByEntity(
        mediaIds,
        EntityType.TEMP_QUESTION,
        tempQuestionId,
      )

    const existingMediaIds = new Set(
      existingUsages.map((u) => u.mediaId),
    )

    await Promise.all(
      medias
        .filter((m) => !existingMediaIds.has(m.mediaId))
        .map((media) =>
          mediaUsageRepository.attach({
            mediaId: media.mediaId,
            entityType: EntityType.TEMP_QUESTION,
            entityId: tempQuestionId,
            usedBy: userId,
          }),
        ),
    )
  }

  private async detachRemovedMedia(
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

      // If this question was the last usage → soft delete media
      if (usages.length === 1 && questionUsage) {
        await this.mediaRepository.softDelete(mediaId)
      }
    }
  }
}

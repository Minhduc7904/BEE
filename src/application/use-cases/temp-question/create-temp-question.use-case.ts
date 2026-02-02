// src/application/use-cases/temp-question/create-temp-question.use-case.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import type {
  IUnitOfWork,
  IMediaRepository,
  IMediaUsageRepository,
  ISubjectRepository,
  IChapterRepository,
  ITempQuestionChapterRepository,
} from '../../../domain/repositories'
import type {
  ITempQuestionRepository,
} from '../../../domain/repositories/temp-question.repository'
import type {
  IExamImportSessionRepository,
} from '../../../domain/repositories/exam-import-session.repository'
import {
  CreateTempQuestionDto,
  TempQuestionResponseDto,
} from '../../dtos/temp-question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import {
  extractAllMediaIds,
  normalizeMediaMarkdown,
} from '../../../shared/utils'

@Injectable()
export class CreateTempQuestionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) { }

  async execute(
    sessionId: number,
    dto: CreateTempQuestionDto,
    userId: number,
  ): Promise<BaseResponseDto<TempQuestionResponseDto>> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const sessionRepository: IExamImportSessionRepository =
        repos.examImportSessionRepository
      const tempQuestionRepository: ITempQuestionRepository =
        repos.tempQuestionRepository
      const mediaUsageRepository: IMediaUsageRepository =
        repos.mediaUsageRepository
      const subjectRepository: ISubjectRepository =
        repos.subjectRepository
      const chapterRepository: IChapterRepository =
        repos.chapterRepository
      const tempQuestionChapterRepository: ITempQuestionChapterRepository =
        repos.tempQuestionChapterRepository

      /* ------------------------------------------------------------------
       * 1. Check session
       * ------------------------------------------------------------------ */
      const session = await sessionRepository.findById(sessionId)
      if (!session) {
        throw new NotFoundException(
          `Session ${sessionId} không tồn tại`,
        )
      }

      /* ------------------------------------------------------------------
       * 1.1. Validate subjectId if provided
       * ------------------------------------------------------------------ */
      if (dto.subjectId) {
        const subject = await subjectRepository.findById(dto.subjectId)
        if (!subject) {
          throw new BadRequestException(
            `Môn học với ID ${dto.subjectId} không tồn tại`,
          )
        }
      }

      /* ------------------------------------------------------------------
       * 1.2. Validate chapterIds if provided
       * ------------------------------------------------------------------ */
      if (dto.chapterIds && dto.chapterIds.length > 0) {
        const chapters = await chapterRepository.findByIds(dto.chapterIds)
        if (chapters.length !== dto.chapterIds.length) {
          const foundIds = chapters.map(c => c.chapterId)
          const missingIds = dto.chapterIds.filter(id => !foundIds.includes(id))
          throw new BadRequestException(
            `Các chương sau không tồn tại: ${missingIds.join(', ')}`,
          )
        }
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
       * 3. Calculate order (find max order in session and add 1)
       * ------------------------------------------------------------------ */
      const existingQuestions = await tempQuestionRepository.findBySessionId(sessionId)
      const maxOrder = existingQuestions.length > 0
        ? Math.max(...existingQuestions.map(q => q.order))
        : 0
      const newOrder = maxOrder + 1

      /* ------------------------------------------------------------------
       * 4. Create TempQuestion
       * ------------------------------------------------------------------ */
      const tempQuestion = await tempQuestionRepository.create({
        sessionId,
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
        order: newOrder,
        metadata: dto.metadata,
      })

      /* ------------------------------------------------------------------
       * 5. Extract media IDs from content & solution
       * ------------------------------------------------------------------ */
      const mediaIds = this.extractMediaIds(
        normalizedContent,
        normalizedSolution,
      )

      /* ------------------------------------------------------------------
       * 6. Attach media (batch)
       * ------------------------------------------------------------------ */
      await this.attachMedia(
        [...mediaIds],
        tempQuestion.tempQuestionId,
        userId,
        mediaUsageRepository,
      )

      /* ------------------------------------------------------------------
       * 6.1. Create TempQuestionChapter records if chapterIds provided
       * ------------------------------------------------------------------ */
      if (dto.chapterIds && dto.chapterIds.length > 0) {
        const chapterData = dto.chapterIds.map(chapterId => ({
          tempQuestionId: tempQuestion.tempQuestionId,
          chapterId,
        }))
        await tempQuestionChapterRepository.createMany(chapterData)
      }

      /* ------------------------------------------------------------------
       * 7. Response
       * ------------------------------------------------------------------ */
      return {
        success: true,
        message: 'Tạo câu hỏi tạm thời thành công',
        data: TempQuestionResponseDto.fromEntity(tempQuestion),
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

  private async attachMedia(
    mediaIds: number[],
    tempQuestionId: number,
    userId: number,
    mediaUsageRepository: IMediaUsageRepository,
  ) {
    if (!mediaIds.length) return

    const medias = await this.mediaRepository.findByIds(mediaIds)

    await Promise.all(
      medias.map((media) =>
        mediaUsageRepository.attach({
          mediaId: media.mediaId,
          entityType: EntityType.TEMP_QUESTION,
          entityId: tempQuestionId,
          usedBy: userId,
        }),
      ),
    )
  }
}

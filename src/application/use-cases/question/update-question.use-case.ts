// src/application/use-cases/question/update-question.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, IMediaRepository } from '../../../domain/repositories'
import { UpdateQuestionDto } from '../../dtos/question/update-question.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { QuestionResponseDto } from '../../dtos/question/question.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { extractAllMediaIds, normalizeMediaMarkdown } from '../../../shared/utils'
import { EntityType } from '../../../shared/constants/entity-type.constants'

@Injectable()
export class UpdateQuestionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(
    questionId: number,
    dto: UpdateQuestionDto,
    adminId?: number,
  ): Promise<BaseResponseDto<QuestionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionRepository = repos.questionRepository
      const questionChapterRepository = repos.questionChapterRepository
      const statementRepository = repos.statementRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const question = await questionRepository.findById(questionId)

      if (!question) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.QUESTION.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.QUESTION,
            resourceId: questionId.toString(),
            errorMessage: 'Không tìm thấy câu hỏi',
          })
        }
        throw new NotFoundException('Không tìm thấy câu hỏi')
      }

      // --- Handle Question Fields Update ---
      const updateData: any = {}
      
      // Handle content with media normalization
      if (dto.content !== undefined) {
        const oldContent = question.content
        const normalizedContent = normalizeMediaMarkdown(dto.content)
        updateData.content = normalizedContent

        // Handle media changes for content
        await this.handleMediaChanges(
          oldContent,
          normalizedContent,
          EntityType.QUESTION,
          questionId,
          adminId!,
          mediaUsageRepository,
        )
      }

      // Handle solution with media normalization
      if (dto.solution !== undefined) {
        const oldSolution = question.solution
        const normalizedSolution = normalizeMediaMarkdown(dto.solution)
        updateData.solution = normalizedSolution

        // Handle media changes for solution
        await this.handleMediaChanges(
          oldSolution,
          normalizedSolution,
          EntityType.QUESTION,
          questionId,
          adminId!,
          mediaUsageRepository,
        )
      }

      // Update other basic fields
      if (dto.type !== undefined) updateData.type = dto.type
      if (dto.correctAnswer !== undefined) updateData.correctAnswer = dto.correctAnswer
      if (dto.solutionYoutubeUrl !== undefined) updateData.solutionYoutubeUrl = dto.solutionYoutubeUrl
      if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty
      if (dto.grade !== undefined) updateData.grade = dto.grade
      if (dto.subjectId !== undefined) updateData.subjectId = dto.subjectId
      if (dto.pointsOrigin !== undefined) updateData.pointsOrigin = dto.pointsOrigin
      if (dto.visibility !== undefined) updateData.visibility = dto.visibility

      const updatedQuestion = await questionRepository.update(questionId, updateData)

      // --- Handle Statements Synchronization ---
      if (dto.statements !== undefined) {
        await this.syncStatements(
          questionId,
          dto.statements,
          adminId!,
          statementRepository,
          mediaUsageRepository,
        )
      }

      // --- Handle Chapters Update ---
      if (dto.chapterIds !== undefined) {
        // Delete existing chapters
        await questionChapterRepository.deleteByQuestionId(questionId)
        
        // Create new chapters
        if (dto.chapterIds.length > 0) {
          const chapterData = dto.chapterIds.map((chapterId) => ({
            questionId,
            chapterId,
          }))
          await questionChapterRepository.createMany(chapterData)
        }
      }

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.QUESTION.UPDATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.QUESTION,
          resourceId: questionId.toString(),
          beforeData: {
            type: question.type,
            visibility: question.visibility,
            subjectId: question.subjectId,
          },
          afterData: {
            type: updatedQuestion.type,
            visibility: updatedQuestion.visibility,
            subjectId: updatedQuestion.subjectId,
          },
        })
      }

      // Reload to get relations
      return await questionRepository.findById(questionId)
    })

    return {
      success: true,
      message: 'Cập nhật câu hỏi thành công',
      data: QuestionResponseDto.fromEntity(result!),
    }
  }

  /**
   * Update statements that have IDs in the DTO
   * Only updates existing statements, does not create or delete
   */
  private async syncStatements(
    questionId: number,
    dtoStatements: Array<any>,
    userId: number,
    statementRepository: any,
    mediaUsageRepository: any,
  ) {
    // Only process statements that have statementId
    for (const dtoStatement of dtoStatements) {
      const statementId = dtoStatement.statementId

      // Skip if no ID - only update existing statements
      if (!statementId) continue

      // Get existing statement
      const existing = await statementRepository.findById(statementId)
      if (!existing) continue // Skip if statement doesn't exist

      const updateData: any = {}

      // Handle content with media
      if (dtoStatement.content !== undefined) {
        const oldContent = existing.content
        const normalizedContent = normalizeMediaMarkdown(dtoStatement.content)
        updateData.content = normalizedContent

        // Handle media changes
        await this.handleMediaChanges(
          oldContent,
          normalizedContent,
          EntityType.STATEMENT,
          statementId,
          userId,
          mediaUsageRepository,
        )
      }

      // Update other fields
      if (dtoStatement.isCorrect !== undefined) updateData.isCorrect = dtoStatement.isCorrect
      if (dtoStatement.order !== undefined) updateData.order = dtoStatement.order
      if (dtoStatement.difficulty !== undefined) updateData.difficulty = dtoStatement.difficulty

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await statementRepository.update(statementId, updateData)
      }
    }
  }

  /**
   * Handle media changes when content is updated
   * - Detach old media that's no longer used
   * - Attach new media that's been added
   */
  private async handleMediaChanges(
    oldContent: string | null | undefined,
    newContent: string | null | undefined,
    entityType: EntityType,
    entityId: number,
    userId: number,
    mediaUsageRepository: any,
  ) {
    const oldMediaIds = new Set(oldContent ? extractAllMediaIds(oldContent) : [])
    const newMediaIds = new Set(newContent ? extractAllMediaIds(newContent) : [])

    // Detach media that's no longer in the new content
    const mediaToDetach = Array.from(oldMediaIds).filter((id) => !newMediaIds.has(id))
    for (const mediaId of mediaToDetach) {
      // Find existing usages and detach them
      const existingUsages = await mediaUsageRepository.findAll({
        mediaId,
        entityType,
        entityId,
      })
      for (const usage of existingUsages) {
        await mediaUsageRepository.detach(usage.usageId)
      }
    }

    // Attach new media that wasn't in the old content
    const mediaToAttach = Array.from(newMediaIds).filter((id) => !oldMediaIds.has(id))
    if (mediaToAttach.length > 0) {
      await this.attachMediaFromContents(
        [newContent],
        entityType,
        entityId,
        userId,
        mediaUsageRepository,
      )
    }
  }

  /**

   * Extract mediaIds from multiple contents and attach usage (batch-safe)
   * Reused from CreateQuestionUseCase pattern
   */
  private async attachMediaFromContents(
    contents: Array<string | null | undefined>,
    entityType: EntityType,
    entityId: number,
    userId: number,
    mediaUsageRepository: any,
  ) {
    const mediaIds = new Set<number>()

    for (const content of contents) {
      if (!content) continue
      extractAllMediaIds(content).forEach((id) => mediaIds.add(id))
    }

    if (mediaIds.size === 0) return

    const ids = Array.from(mediaIds)

    const medias = await this.mediaRepository.findByIds(ids)
    const existingUsages = await mediaUsageRepository.findExistingByEntity(ids, entityType, entityId)

    const existingMediaIds = new Set(existingUsages.map((u) => u.mediaId))

    const attachTasks = medias
      .filter((m) => !existingMediaIds.has(m.mediaId))
      .map((media) =>
        mediaUsageRepository.attach({
          mediaId: media.mediaId,
          entityType,
          entityId,
          usedBy: userId,
        }),
      )

    await Promise.all(attachTasks)
  }
}

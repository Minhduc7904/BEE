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
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { QUESTION_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class UpdateQuestionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,) { }

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

        const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
          { fieldName: QUESTION_MEDIA_FIELDS.CONTENT, content: dto.content },
        ])

        const normalizedContent = this.attachMediaFromContentUseCase.getNormalizedContent(
          normalizedResults,
          QUESTION_MEDIA_FIELDS.CONTENT,
        ) || ''

        updateData.content = normalizedContent

        // Sync media changes for content
        await this.attachMediaFromContentUseCase.syncMediaOnUpdate(
          oldContent,
          normalizedContent,
          EntityType.QUESTION,
          questionId,
          adminId!,
          mediaUsageRepository,
          QUESTION_MEDIA_FIELDS.CONTENT,
        )
      }

      // Handle solution with media normalization
      if (dto.solution !== undefined) {
        const oldSolution = question.solution

        const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
          { fieldName: QUESTION_MEDIA_FIELDS.SOLUTION, content: dto.solution },
        ])

        const normalizedSolution = this.attachMediaFromContentUseCase.getNormalizedContent(
          normalizedResults,
          QUESTION_MEDIA_FIELDS.SOLUTION,
        )

        updateData.solution = normalizedSolution

        // Sync media changes for solution
        await this.attachMediaFromContentUseCase.syncMediaOnUpdate(
          oldSolution,
          normalizedSolution,
          EntityType.QUESTION,
          questionId,
          adminId!,
          mediaUsageRepository,
          QUESTION_MEDIA_FIELDS.SOLUTION,
        )
      }

      if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty
      if (dto.grade !== undefined) updateData.grade = dto.grade
      if (dto.subjectId !== undefined) updateData.subjectId = dto.subjectId
      if (dto.pointsOrigin !== undefined) updateData.pointsOrigin = dto.pointsOrigin
      if (dto.visibility !== undefined) updateData.visibility = dto.visibility

      const updatedQuestion = await questionRepository.update(questionId, updateData)

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
}

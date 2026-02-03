// src/application/use-cases/question/create-question.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, IMediaRepository } from '../../../domain/repositories'
import { CreateQuestionDto } from '../../dtos/question/create-question.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { QuestionResponseDto } from '../../dtos/question/question.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { Visibility } from 'src/shared/enums'
import { extractAllMediaIds, normalizeMediaMarkdown } from '../../../shared/utils'
import { EntityType } from '../../../shared/constants/entity-type.constants'

@Injectable()
export class CreateQuestionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(dto: CreateQuestionDto, adminId?: number): Promise<BaseResponseDto<QuestionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionRepository = repos.questionRepository
      const questionChapterRepository = repos.questionChapterRepository
      const statementRepository = repos.statementRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Normalize content and solution
      const normalizedContent = dto.content ? normalizeMediaMarkdown(dto.content) : dto.content
      const normalizedSolution = dto.solution ? normalizeMediaMarkdown(dto.solution) : dto.solution

      const createData = {
        content: normalizedContent,
        type: dto.type,
        correctAnswer: dto.correctAnswer,
        solution: normalizedSolution,
        solutionYoutubeUrl: dto.solutionYoutubeUrl,
        difficulty: dto.difficulty || null,
        grade: dto.grade || null,
        subjectId: dto.subjectId,
        pointsOrigin: dto.pointsOrigin,
        visibility: dto.visibility || Visibility.DRAFT,
        createdBy: adminId!,
      }

      const question = await questionRepository.create(createData)

      // Attach media for question (from content and solution)
      await this.attachMediaFromContents(
        [normalizedContent, normalizedSolution],
        EntityType.QUESTION,
        question.questionId,
        adminId!,
        mediaUsageRepository,
      )

      // Link chapters if provided
      if (dto.chapterIds && dto.chapterIds.length > 0) {
        const chapterData = dto.chapterIds.map((chapterId) => ({
          questionId: question.questionId,
          chapterId,
        }))
        await questionChapterRepository.createMany(chapterData)
      }

      // Create statements if provided
      if (dto.statements && dto.statements.length > 0) {
        for (let i = 0; i < dto.statements.length; i++) {
          const statement = dto.statements[i]
          
          // Normalize statement content
          const normalizedStatementContent = statement.content 
            ? normalizeMediaMarkdown(statement.content) 
            : statement.content

          const statementData = {
            questionId: question.questionId,
            content: normalizedStatementContent,
            isCorrect: statement.isCorrect,
            order: statement.order !== undefined ? statement.order : i + 1,
            difficulty: statement.difficulty || null,
          }

          const createdStatement = await statementRepository.create(statementData)

          // Attach media for statement
          await this.attachMediaFromContents(
            [normalizedStatementContent],
            EntityType.STATEMENT,
            createdStatement.statementId,
            adminId!,
            mediaUsageRepository,
          )
        }
      }

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.QUESTION.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.QUESTION,
          resourceId: question.questionId.toString(),
          afterData: {
            type: question.type,
            visibility: question.visibility,
            subjectId: question.subjectId,
          },
        })
      }

      // Reload to get relations
      return await questionRepository.findById(question.questionId)
    })

    return {
      success: true,
      message: 'Tạo câu hỏi thành công',
      data: QuestionResponseDto.fromEntity(result!),
    }
  }

  /**
   * Extract mediaIds from multiple contents and attach usage (batch-safe)
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
    const existingUsages = await mediaUsageRepository.findExistingByEntity(
      ids,
      entityType,
      entityId,
    )

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

// src/application/use-cases/statement/create-statement.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, IMediaRepository } from '../../../domain/repositories'
import { CreateStatementDto } from '../../dtos/statement/create-statement.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StatementResponseDto } from '../../dtos/statement/statement.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { extractAllMediaIds, normalizeMediaMarkdown } from '../../../shared/utils'
import { EntityType } from '../../../shared/constants/entity-type.constants'

@Injectable()
export class CreateStatementUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(
    questionId: number,
    dto: CreateStatementDto,
    adminId?: number,
  ): Promise<BaseResponseDto<StatementResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const statementRepository = repos.statementRepository
      const questionRepository = repos.questionRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Verify question exists
      const question = await questionRepository.findById(questionId)
      if (!question) {
        throw new Error(`Question with ID ${questionId} not found`)
      }

      // Normalize statement content
      const normalizedContent = dto.content ? normalizeMediaMarkdown(dto.content) : dto.content

      // Get existing statements count to determine default order
      const existingStatements = await statementRepository.findByQuestionId(questionId)
      const defaultOrder = existingStatements.length + 1

      const createData = {
        questionId,
        content: normalizedContent,
        isCorrect: dto.isCorrect,
        order: dto.order ?? defaultOrder,
        difficulty: dto.difficulty || null,
      }

      const statement = await statementRepository.create(createData)

      // Attach media for statement
      await this.attachMediaFromContent(
        normalizedContent,
        EntityType.STATEMENT,
        statement.statementId,
        adminId!,
        mediaUsageRepository,
      )

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.STATEMENT.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.STATEMENT,
          resourceId: statement.statementId.toString(),
          afterData: {
            questionId: statement.questionId,
            isCorrect: statement.isCorrect,
            order: statement.order,
          },
        })
      }

      return statement
    })

    return {
      success: true,
      message: 'Tạo đáp án thành công',
      data: StatementResponseDto.fromEntity(result!),
    }
  }

  /**
   * Extract mediaIds from content and attach usage
   */
  private async attachMediaFromContent(
    content: string | null | undefined,
    entityType: EntityType,
    entityId: number,
    userId: number,
    mediaUsageRepository: any,
  ) {
    if (!content) return

    const mediaIdsSet = extractAllMediaIds(content)
    const mediaIds = Array.from(mediaIdsSet)
    if (mediaIds.length === 0) return

    const medias = await this.mediaRepository.findByIds(mediaIds)
    const existingUsages = await mediaUsageRepository.findExistingByEntity(mediaIds, entityType, entityId)

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

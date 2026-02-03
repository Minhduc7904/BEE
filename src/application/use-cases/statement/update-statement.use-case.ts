// src/application/use-cases/statement/update-statement.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, IMediaRepository } from '../../../domain/repositories'
import { UpdateStatementDto } from '../../dtos/statement/update-statement.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StatementResponseDto } from '../../dtos/statement/statement.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { extractAllMediaIds, normalizeMediaMarkdown } from '../../../shared/utils'
import { EntityType } from '../../../shared/constants/entity-type.constants'

@Injectable()
export class UpdateStatementUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(
    statementId: number,
    dto: UpdateStatementDto,
    adminId?: number,
  ): Promise<BaseResponseDto<StatementResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const statementRepository = repos.statementRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const statement = await statementRepository.findById(statementId)

      if (!statement) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.STATEMENT.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.STATEMENT,
            resourceId: statementId.toString(),
            errorMessage: 'Không tìm thấy đáp án',
          })
        }
        throw new NotFoundException('Không tìm thấy đáp án')
      }

      const updateData: any = {}

      // Handle content with media normalization
      if (dto.content !== undefined) {
        const oldContent = statement.content
        const normalizedContent = normalizeMediaMarkdown(dto.content)
        updateData.content = normalizedContent

        // Handle media changes for content
        await this.handleMediaChanges(
          oldContent,
          normalizedContent,
          EntityType.STATEMENT,
          statementId,
          adminId!,
          mediaUsageRepository,
        )
      }

      // Update other basic fields
      if (dto.isCorrect !== undefined) updateData.isCorrect = dto.isCorrect
      if (dto.order !== undefined) updateData.order = dto.order
      if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty

      const updatedStatement = await statementRepository.update(statementId, updateData)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.STATEMENT.UPDATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.STATEMENT,
          resourceId: statementId.toString(),
          beforeData: {
            isCorrect: statement.isCorrect,
            order: statement.order,
          },
          afterData: {
            isCorrect: updatedStatement.isCorrect,
            order: updatedStatement.order,
          },
        })
      }

      return updatedStatement
    })

    return {
      success: true,
      message: 'Cập nhật đáp án thành công',
      data: StatementResponseDto.fromEntity(result),
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

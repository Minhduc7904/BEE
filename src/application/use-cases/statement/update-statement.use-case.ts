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
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { STATEMENT_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class UpdateStatementUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,

    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(
    statementId: number,
    dto: UpdateStatementDto,
    adminId?: number,
    userId?: number,
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
        
        // Normalize new content
        const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
          { fieldName: STATEMENT_MEDIA_FIELDS.CONTENT, content: dto.content },
        ])
        
        const normalizedContent = this.attachMediaFromContentUseCase.getNormalizedContent(
          normalizedResults,
          STATEMENT_MEDIA_FIELDS.CONTENT,
        ) || ''
        
        updateData.content = normalizedContent

        // Sync media changes
        await this.attachMediaFromContentUseCase.syncMediaOnUpdate(
          oldContent,
          normalizedContent,
          EntityType.STATEMENT,
          statementId,
          userId!,
          mediaUsageRepository,
          STATEMENT_MEDIA_FIELDS.CONTENT,
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
}

// src/application/use-cases/question/delete-question.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'

@Injectable()
export class DeleteQuestionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(questionId: number, adminId?: number): Promise<BaseResponseDto<boolean>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionRepository = repos.questionRepository
      const statementRepository = repos.statementRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const question = await questionRepository.findById(questionId)

      if (!question) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.QUESTION.DELETE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.QUESTION,
            resourceId: questionId.toString(),
            errorMessage: 'Không tìm thấy câu hỏi',
          })
        }
        throw new NotFoundException('Không tìm thấy câu hỏi')
      }

      // Detach all media from question (content, solution)
      await this.attachMediaFromContentUseCase.detachAllMediaFromEntity(
        EntityType.QUESTION,
        questionId,
        mediaUsageRepository,
      )

      // Get all statements and detach their media
      const statements = await statementRepository.findByQuestionId(questionId)
      for (const statement of statements) {
        await this.attachMediaFromContentUseCase.detachAllMediaFromEntity(
          EntityType.STATEMENT,
          statement.statementId,
          mediaUsageRepository,
        )
      }

      // Now delete the question (cascade will delete statements and chapters)
      await questionRepository.delete(questionId)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.QUESTION.DELETE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.QUESTION,
          resourceId: questionId.toString(),
          beforeData: {
            type: question.type,
            visibility: question.visibility,
            subjectId: question.subjectId,
          },
        })
      }

      return true
    })

    return {
      success: true,
      message: 'Xóa câu hỏi thành công',
      data: result,
    }
  }
}

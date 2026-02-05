// src/application/use-cases/exam/delete-exam.use-case.ts
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
export class DeleteExamUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(examId: number, adminId?: number): Promise<BaseResponseDto<boolean>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const examRepository = repos.examRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const exam = await examRepository.findById(examId)

      if (!exam) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.EXAM.DELETE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.EXAM,
            resourceId: examId.toString(),
            errorMessage: 'Không tìm thấy đề thi',
          })
        }
        throw new NotFoundException('Không tìm thấy đề thi')
      }

      // Detach all media from exam (description and other media fields)
      await this.attachMediaFromContentUseCase.detachAllMediaFromEntity(
        EntityType.EXAM,
        examId,
        mediaUsageRepository,
      )

      await examRepository.delete(examId)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.EXAM.DELETE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.EXAM,
          resourceId: examId.toString(),
          beforeData: {
            title: exam.title,
            visibility: exam.visibility,
            grade: exam.grade,
          },
        })
      }

      return true
    })

    return {
      success: true,
      message: 'Xóa đề thi thành công',
      data: result,
    }
  }
}

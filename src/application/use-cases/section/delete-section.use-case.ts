// src/application/use-cases/section/delete-section.use-case.ts
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
export class DeleteSectionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(sectionId: number, adminId?: number): Promise<BaseResponseDto<boolean>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const sectionRepository = repos.sectionRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const section = await sectionRepository.findById(sectionId)

      if (!section) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.SECTION?.DELETE || 'SECTION_DELETE',
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.SECTION || 'SECTION',
            resourceId: sectionId.toString(),
            errorMessage: 'Không tìm thấy phần',
          })
        }
        throw new NotFoundException('Không tìm thấy phần')
      }

      // Detach all media from section (description and other media fields)
      await this.attachMediaFromContentUseCase.detachAllMediaFromEntity(
        EntityType.SECTION,
        sectionId,
        mediaUsageRepository,
      )

      // Delete the section (cascade will handle related data)
      await sectionRepository.delete(sectionId)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.SECTION?.DELETE || 'SECTION_DELETE',
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.SECTION || 'SECTION',
          resourceId: sectionId.toString(),
          beforeData: {
            examId: section.examId,
            title: section.title,
            order: section.order,
          },
        })
      }

      return true
    })

    return {
      success: true,
      message: 'Xóa phần thành công',
      data: result,
    }
  }
}

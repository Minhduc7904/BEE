// src/application/use-cases/section/update-section.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { UpdateSectionDto } from '../../dtos/section/update-section.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { SectionResponseDto } from '../../dtos/section/section.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateSectionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(sectionId: number, dto: UpdateSectionDto, adminId?: number): Promise<BaseResponseDto<SectionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const sectionRepository = repos.sectionRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const existingSection = await sectionRepository.findById(sectionId)

      if (!existingSection) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.SECTION?.UPDATE || 'SECTION_UPDATE',
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.SECTION || 'SECTION',
            resourceId: sectionId.toString(),
            errorMessage: 'Không tìm thấy phần',
          })
        }
        throw new NotFoundException('Không tìm thấy phần')
      }

      const updateData: any = {}
      if (dto.title !== undefined) updateData.title = dto.title
      if (dto.description !== undefined) updateData.description = dto.description
      if (dto.order !== undefined) updateData.order = dto.order

      const updatedSection = await sectionRepository.update(sectionId, updateData)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.SECTION?.UPDATE || 'SECTION_UPDATE',
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.SECTION || 'SECTION',
          resourceId: sectionId.toString(),
          beforeData: {
            title: existingSection.title,
            description: existingSection.description,
            order: existingSection.order,
          },
          afterData: {
            title: updatedSection.title,
            description: updatedSection.description,
            order: updatedSection.order,
          },
        })
      }

      return updatedSection
    })

    return {
      success: true,
      message: 'Cập nhật phần thành công',
      data: SectionResponseDto.fromEntity(result),
    }
  }
}

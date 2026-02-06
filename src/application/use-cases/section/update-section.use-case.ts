// src/application/use-cases/section/update-section.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, IMediaRepository } from '../../../domain/repositories'
import { UpdateSectionDto } from '../../dtos/section/update-section.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { SectionResponseDto } from '../../dtos/section/section.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { SECTION_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class UpdateSectionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(sectionId: number, dto: UpdateSectionDto, adminId?: number): Promise<BaseResponseDto<SectionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const sectionRepository = repos.sectionRepository
      const mediaUsageRepository = repos.mediaUsageRepository
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
      if (dto.order !== undefined) updateData.order = dto.order

      // Handle description with media normalization
      if (dto.description !== undefined) {
        const oldDescription = existingSection.description

        const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
          { fieldName: SECTION_MEDIA_FIELDS.DESCRIPTION, content: dto.description },
        ])

        const normalizedDescription = this.attachMediaFromContentUseCase.getNormalizedContent(
          normalizedResults,
          SECTION_MEDIA_FIELDS.DESCRIPTION,
        )

        updateData.description = normalizedDescription

        // Sync media changes for description
        await this.attachMediaFromContentUseCase.syncMediaOnUpdate(
          oldDescription,
          normalizedDescription,
          EntityType.SECTION,
          sectionId,
          adminId!,
          mediaUsageRepository,
          SECTION_MEDIA_FIELDS.DESCRIPTION,
        )
      }

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

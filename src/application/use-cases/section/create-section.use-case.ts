// src/application/use-cases/section/create-section.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { CreateSectionDto } from '../../dtos/section/create-section.dto'
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
export class CreateSectionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(dto: CreateSectionDto, adminId?: number): Promise<BaseResponseDto<SectionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const sectionRepository = repos.sectionRepository
      const examRepository = repos.examRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Verify exam exists
      const exam = await examRepository.findById(dto.examId)
      if (!exam) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.SECTION?.CREATE || 'SECTION_CREATE',
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.SECTION || 'SECTION',
            resourceId: dto.examId.toString(),
            errorMessage: 'Không tìm thấy đề thi',
          })
        }
        throw new NotFoundException('Không tìm thấy đề thi')
      }

      // Calculate order if not provided
      let order = dto.order
      if (order === undefined || order === null) {
        const existingSections = await sectionRepository.findByExamId(dto.examId)
        order = existingSections.length > 0 
          ? Math.max(...existingSections.map(s => s.order)) + 1 
          : 1
      }

      // Normalize and extract media from description
      const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
        { fieldName: SECTION_MEDIA_FIELDS.DESCRIPTION, content: dto.description },
      ])

      const createData = {
        examId: dto.examId,
        title: dto.title,
        description: this.attachMediaFromContentUseCase.getNormalizedContent(
          normalizedResults, 
          SECTION_MEDIA_FIELDS.DESCRIPTION
        ),
        order,
      }

      const section = await sectionRepository.create(createData)

      // Attach media to section
      await this.attachMediaFromContentUseCase.attachMedia(
        normalizedResults,
        EntityType.SECTION,
        section.sectionId,
        adminId!,
        mediaUsageRepository,
      )

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.SECTION?.CREATE || 'SECTION_CREATE',
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.SECTION || 'SECTION',
          resourceId: section.sectionId.toString(),
          afterData: {
            examId: section.examId,
            title: section.title,
            order: section.order,
          },
        })
      }

      return section
    })

    return {
      success: true,
      message: 'Tạo phần thành công',
      data: SectionResponseDto.fromEntity(result),
    }
  }
}

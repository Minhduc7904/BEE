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

@Injectable()
export class CreateSectionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: CreateSectionDto, adminId?: number): Promise<BaseResponseDto<SectionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const sectionRepository = repos.sectionRepository
      const examRepository = repos.examRepository
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

      const createData = {
        examId: dto.examId,
        title: dto.title,
        description: dto.description,
        order: dto.order,
      }

      const section = await sectionRepository.create(createData)

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

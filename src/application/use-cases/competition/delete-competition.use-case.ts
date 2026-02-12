// src/application/use-cases/competition/delete-competition.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteCompetitionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(id: number, adminId?: number): Promise<BaseResponseDto<boolean>> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const competitionRepository = repos.competitionRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Check if competition exists
      const existing = await competitionRepository.findById(id)
      if (!existing) {
        throw new NotFoundException(`Cuộc thi với ID ${id} không tồn tại`)
      }

      await competitionRepository.delete(id)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.COMPETITION.DELETE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.COMPETITION,
          resourceId: id.toString(),
          beforeData: {
            title: existing.title,
            visibility: existing.visibility,
          },
        })
      }
    })

    return BaseResponseDto.success('Xóa cuộc thi thành công', true)
  }
}

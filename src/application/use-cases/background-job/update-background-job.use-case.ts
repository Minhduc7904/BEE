import { Inject, Injectable } from '@nestjs/common'

import { BackgroundJobResponseDto, BaseResponseDto, UpdateBackgroundJobDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { AuditStatus } from '../../../shared/enums'

@Injectable()
export class UpdateBackgroundJobUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    backgroundJobId: number,
    dto: UpdateBackgroundJobDto,
    adminId: number,
  ): Promise<BaseResponseDto<BackgroundJobResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.backgroundJobRepository.findById(backgroundJobId)
      if (!current) throw new NotFoundException(`Không tìm thấy job nền với ID ${backgroundJobId}`)

      if (current.isEnabled === dto.isEnabled) return BackgroundJobResponseDto.fromBackgroundJob(current)

      const updated = await repos.backgroundJobRepository.update(backgroundJobId, { isEnabled: dto.isEnabled })
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BACKGROUND_JOB.UPDATE,
        resourceType: RESOURCE_TYPES.BACKGROUND_JOB,
        resourceId: String(backgroundJobId),
        status: AuditStatus.SUCCESS,
        beforeData: this.toAuditData(current),
        afterData: this.toAuditData(updated),
      })
      return BackgroundJobResponseDto.fromBackgroundJob(updated)
    })

    return BaseResponseDto.success('Cập nhật trạng thái job nền thành công', response)
  }

  private toAuditData(job: { backgroundJobId: number; code: string; isEnabled: boolean }) {
    return {
      backgroundJobId: job.backgroundJobId,
      code: job.code,
      isEnabled: job.isEnabled,
    }
  }
}

import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'

@Injectable()
export class DeleteAssistantTaskUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantTaskId: number, actorAdminId: number) {
    await this.uow.executeInTransaction(async (repos) => {
      const current = await repos.assistantTaskRepository.findById(assistantTaskId)
      if (!current) throw new NotFoundException('Công việc trợ giảng không tồn tại')

      await repos.assistantTaskRepository.delete(assistantTaskId)
      await writeAssistantTaskAudit(repos, {
        adminId: actorAdminId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK.DELETE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK,
        resourceId: assistantTaskId,
        beforeData: current,
      })
    })

    return BaseResponseDto.success('Xóa công việc trợ giảng thành công')
  }
}

import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { InvalidStateException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'

@Injectable()
export class DeleteAssistantTaskProductUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantTaskProductId: number, actorAdminId: number) {
    await this.uow.executeInTransaction(async (repos) => {
      const current = await repos.assistantTaskProductRepository.findById(assistantTaskProductId)
      if (!current) throw new NotFoundException('Sản phẩm trợ giảng không tồn tại')

      const submissionCount =
        await repos.assistantTaskProductSubmissionRepository.countByProductId(assistantTaskProductId)
      if (submissionCount > 0) {
        throw new InvalidStateException('Phải gỡ sản phẩm khỏi tất cả công việc trước khi xóa')
      }

      await repos.assistantTaskProductRepository.delete(assistantTaskProductId)
      await writeAssistantTaskAudit(repos, {
        adminId: actorAdminId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK_PRODUCT.DELETE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK_PRODUCT,
        resourceId: assistantTaskProductId,
        beforeData: current,
      })
    })

    return BaseResponseDto.success('Xóa sản phẩm trợ giảng thành công')
  }
}

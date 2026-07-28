import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'
import { AssistantTaskProductSubmissionService } from './assistant-task-product-submission.service'

@Injectable()
export class RemoveMyAssistantTaskProductUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    private readonly submissionService: AssistantTaskProductSubmissionService,
  ) {}

  async execute(assistantTaskId: number, assistantTaskProductId: number, assistantId: number) {
    await this.uow.executeInTransaction(async (repos) => {
      const removed = await this.submissionService.remove(repos, assistantTaskId, assistantTaskProductId, assistantId)
      await writeAssistantTaskAudit(repos, {
        adminId: assistantId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK_PRODUCT_SUBMISSION.DELETE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK_PRODUCT_SUBMISSION,
        resourceId: removed.assistantTaskProductSubmissionId,
        beforeData: removed,
      })
    })

    return BaseResponseDto.success('Gỡ sản phẩm của tôi khỏi công việc thành công')
  }
}

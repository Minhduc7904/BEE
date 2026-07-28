import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskProductSubmissionResponseDto, BaseResponseDto, SubmitAssistantTaskProductDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'
import { AssistantTaskProductSubmissionService } from './assistant-task-product-submission.service'

@Injectable()
export class SubmitAssistantTaskProductUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    private readonly submissionService: AssistantTaskProductSubmissionService,
  ) {}

  async execute(dto: SubmitAssistantTaskProductDto, actorAdminId: number) {
    const submission = await this.uow.executeInTransaction(async (repos) => {
      const created = await this.submissionService.submit(repos, dto.assistantTaskId, dto.assistantTaskProductId)
      await writeAssistantTaskAudit(repos, {
        adminId: actorAdminId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK_PRODUCT_SUBMISSION.CREATE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK_PRODUCT_SUBMISSION,
        resourceId: created.assistantTaskProductSubmissionId,
        afterData: created,
      })
      return created
    })

    return BaseResponseDto.success(
      'Gắn sản phẩm vào công việc thành công',
      new AssistantTaskProductSubmissionResponseDto(submission),
    )
  }
}

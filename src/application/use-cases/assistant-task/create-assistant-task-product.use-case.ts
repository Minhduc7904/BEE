import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskProductResponseDto, BaseResponseDto, CreateAssistantTaskProductDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'
import { CreateAssistantTaskProductService } from './create-assistant-task-product.service'

@Injectable()
export class CreateAssistantTaskProductUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    private readonly creationService: CreateAssistantTaskProductService,
  ) {}

  async execute(assistantId: number, dto: CreateAssistantTaskProductDto, actorAdminId: number) {
    const product = await this.uow.executeInTransaction(async (repos) => {
      const created = await this.creationService.create(repos, {
        assistantId,
        examId: dto.examId,
        name: dto.name,
        quantity: dto.quantity,
      })
      await writeAssistantTaskAudit(repos, {
        adminId: actorAdminId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK_PRODUCT.CREATE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK_PRODUCT,
        resourceId: created.assistantTaskProductId,
        afterData: created,
      })
      return created
    })

    return BaseResponseDto.success(
      'Tạo sản phẩm cho trợ giảng thành công',
      new AssistantTaskProductResponseDto(product),
    )
  }
}

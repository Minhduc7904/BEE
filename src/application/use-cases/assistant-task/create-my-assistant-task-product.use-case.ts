import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskProductResponseDto, BaseResponseDto, CreateMyAssistantTaskProductDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'
import { CreateAssistantTaskProductService } from './create-assistant-task-product.service'

@Injectable()
export class CreateMyAssistantTaskProductUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    private readonly creationService: CreateAssistantTaskProductService,
  ) {}

  async execute(dto: CreateMyAssistantTaskProductDto, assistantId: number) {
    const product = await this.uow.executeInTransaction(async (repos) => {
      const created = await this.creationService.create(repos, {
        assistantId,
        examId: dto.examId,
        name: dto.name,
      })
      await writeAssistantTaskAudit(repos, {
        adminId: assistantId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK_PRODUCT.CREATE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK_PRODUCT,
        resourceId: created.assistantTaskProductId,
        afterData: created,
      })
      return created
    })

    return BaseResponseDto.success('Tạo sản phẩm của tôi thành công', new AssistantTaskProductResponseDto(product))
  }
}

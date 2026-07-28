import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskProductResponseDto, BaseResponseDto, UpdateMyAssistantTaskProductDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotFoundException, PermissionDeniedException } from '../../../shared/exceptions/custom-exceptions'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'

@Injectable()
export class UpdateMyAssistantTaskProductUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantTaskProductId: number, dto: UpdateMyAssistantTaskProductDto, assistantId: number) {
    const product = await this.uow.executeInTransaction(async (repos) => {
      const current = await repos.assistantTaskProductRepository.findById(assistantTaskProductId)
      if (!current) throw new NotFoundException('Sản phẩm trợ giảng không tồn tại')
      if (current.assistantId !== assistantId) {
        throw new PermissionDeniedException('Bạn không sở hữu sản phẩm này')
      }

      const updated = await repos.assistantTaskProductRepository.update(assistantTaskProductId, { name: dto.name })
      await writeAssistantTaskAudit(repos, {
        adminId: assistantId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK_PRODUCT.UPDATE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK_PRODUCT,
        resourceId: assistantTaskProductId,
        beforeData: current,
        afterData: updated,
      })
      return updated
    })

    return BaseResponseDto.success('Cập nhật sản phẩm của tôi thành công', new AssistantTaskProductResponseDto(product))
  }
}

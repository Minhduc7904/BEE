import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskProductResponseDto, BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetAssistantTaskProductUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantTaskProductId: number, includeTasks = true) {
    const product = await this.uow.executeInTransaction((repos) =>
      repos.assistantTaskProductRepository.findById(assistantTaskProductId, {
        includeTasks,
      }),
    )
    if (!product) throw new NotFoundException('Sản phẩm trợ giảng không tồn tại')

    return BaseResponseDto.success('Lấy sản phẩm trợ giảng thành công', new AssistantTaskProductResponseDto(product))
  }
}

import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskResponseDto, BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetAssistantTaskUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantTaskId: number, includeProducts = true) {
    const task = await this.uow.executeInTransaction((repos) =>
      repos.assistantTaskRepository.findById(assistantTaskId, { includeProducts }),
    )
    if (!task) throw new NotFoundException('Công việc trợ giảng không tồn tại')

    return BaseResponseDto.success('Lấy công việc trợ giảng thành công', new AssistantTaskResponseDto(task))
  }
}

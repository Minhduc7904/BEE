import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskProductListQueryDto, AssistantTaskProductResponseDto, PaginationResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { assertDateRange } from './assistant-task.use-case.helpers'

@Injectable()
export class GetAssistantTaskProductsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(query: AssistantTaskProductListQueryDto, ownerAssistantId?: number) {
    assertDateRange(query.startAt, query.endAt)
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const options = {
      skip: (page - 1) * limit,
      take: limit,
      assistantId: ownerAssistantId ?? query.assistantId,
      examId: query.examId,
      taskId: query.taskId,
      createdAtFrom: query.startAt ? new Date(query.startAt) : undefined,
      createdAtTo: query.endAt ? new Date(query.endAt) : undefined,
      includeTasks: query.includeTasks,
    }

    const { items, total } = await this.uow.executeInTransaction(async (repos) => ({
      items: await repos.assistantTaskProductRepository.findAll(options),
      total: await repos.assistantTaskProductRepository.count(options),
    }))

    return PaginationResponseDto.success(
      'Lấy danh sách sản phẩm trợ giảng thành công',
      items.map((item) => new AssistantTaskProductResponseDto(item)),
      page,
      limit,
      total,
    )
  }
}

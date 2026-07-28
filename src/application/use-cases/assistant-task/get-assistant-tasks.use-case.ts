import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskListQueryDto, AssistantTaskResponseDto, PaginationResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { assertDateRange } from './assistant-task.use-case.helpers'

@Injectable()
export class GetAssistantTasksUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(query: AssistantTaskListQueryDto) {
    assertDateRange(query.startAt, query.endAt)
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const options = {
      skip: (page - 1) * limit,
      take: limit,
      courseId: query.courseId,
      assistantId: query.assistantId,
      productId: query.productId,
      taskName: query.taskName,
      taskType: query.taskType,
      status: query.status,
      isBaseTask: query.isBaseTask,
      deadlineAtFrom: query.startAt ? new Date(query.startAt) : undefined,
      deadlineAtTo: query.endAt ? new Date(query.endAt) : undefined,
      includeProducts: query.includeProducts,
    }

    const { items, total } = await this.uow.executeInTransaction(async (repos) => ({
      items: await repos.assistantTaskRepository.findAll(options),
      total: await repos.assistantTaskRepository.count(options),
    }))

    return PaginationResponseDto.success(
      'Lấy danh sách công việc trợ giảng thành công',
      items.map((item) => new AssistantTaskResponseDto(item)),
      page,
      limit,
      total,
    )
  }
}

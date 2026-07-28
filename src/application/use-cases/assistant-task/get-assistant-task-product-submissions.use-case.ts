import { Inject, Injectable } from '@nestjs/common'

import {
  AssistantTaskProductSubmissionListQueryDto,
  AssistantTaskProductSubmissionResponseDto,
  PaginationResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { assertDateRange } from './assistant-task.use-case.helpers'

@Injectable()
export class GetAssistantTaskProductSubmissionsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(query: AssistantTaskProductSubmissionListQueryDto) {
    assertDateRange(query.startAt, query.endAt)
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const options = {
      skip: (page - 1) * limit,
      take: limit,
      assistantTaskId: query.assistantTaskId,
      assistantTaskProductId: query.assistantTaskProductId,
      submittedAtFrom: query.startAt ? new Date(query.startAt) : undefined,
      submittedAtTo: query.endAt ? new Date(query.endAt) : undefined,
    }

    const { items, total } = await this.uow.executeInTransaction(async (repos) => ({
      items: await repos.assistantTaskProductSubmissionRepository.findAll(options),
      total: await repos.assistantTaskProductSubmissionRepository.count(options),
    }))

    return PaginationResponseDto.success(
      'Lấy danh sách lần nộp sản phẩm thành công',
      items.map((item) => new AssistantTaskProductSubmissionResponseDto(item)),
      page,
      limit,
      total,
    )
  }
}

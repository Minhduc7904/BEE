import { Inject, Injectable } from '@nestjs/common'

import { BackgroundJobLockListQueryDto, BackgroundJobLockResponseDto, PaginationResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetBackgroundJobLocksUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: BackgroundJobLockListQueryDto): Promise<PaginationResponseDto<BackgroundJobLockResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { data, total } = await repos.backgroundJobLockRepository.findAll(query.toBackgroundJobLockListOptions())
      return { data: BackgroundJobLockResponseDto.fromBackgroundJobLockList(data), total }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách lock job nền thành công',
      result.data,
      query.page ?? 1,
      query.limit ?? 10,
      result.total,
    )
  }
}

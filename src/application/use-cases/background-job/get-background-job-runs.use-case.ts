import { Inject, Injectable } from '@nestjs/common'

import { BackgroundJobRunListQueryDto, BackgroundJobRunResponseDto, PaginationResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetBackgroundJobRunsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: BackgroundJobRunListQueryDto): Promise<PaginationResponseDto<BackgroundJobRunResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { data, total } = await repos.backgroundJobRunRepository.findAll(query.toBackgroundJobRunListOptions())
      return { data: BackgroundJobRunResponseDto.fromBackgroundJobRunList(data), total }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách lần chạy job nền thành công',
      result.data,
      query.page ?? 1,
      query.limit ?? 10,
      result.total,
    )
  }
}

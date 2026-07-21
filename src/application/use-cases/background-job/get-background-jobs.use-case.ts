import { Inject, Injectable } from '@nestjs/common'

import { BackgroundJobListQueryDto, BackgroundJobResponseDto, PaginationResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetBackgroundJobsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: BackgroundJobListQueryDto): Promise<PaginationResponseDto<BackgroundJobResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { data, total } = await repos.backgroundJobRepository.findAll(query.toBackgroundJobListOptions())
      return { data: BackgroundJobResponseDto.fromBackgroundJobList(data), total }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách job nền thành công',
      result.data,
      query.page ?? 1,
      query.limit ?? 10,
      result.total,
    )
  }
}

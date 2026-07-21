import { Inject, Injectable } from '@nestjs/common'

import { BackgroundJobRunResponseDto, BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetBackgroundJobRunByIdUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(backgroundJobRunId: number): Promise<BaseResponseDto<BackgroundJobRunResponseDto>> {
    const run = await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.findById(backgroundJobRunId),
    )
    if (!run) throw new NotFoundException(`Không tìm thấy lần chạy job nền với ID ${backgroundJobRunId}`)

    return BaseResponseDto.success(
      'Lấy chi tiết lần chạy job nền thành công',
      BackgroundJobRunResponseDto.fromBackgroundJobRun(run),
    )
  }
}

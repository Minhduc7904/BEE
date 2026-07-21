import { Inject, Injectable } from '@nestjs/common'

import { BackgroundJobResponseDto, BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetBackgroundJobByIdUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(backgroundJobId: number): Promise<BaseResponseDto<BackgroundJobResponseDto>> {
    const job = await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRepository.findById(backgroundJobId),
    )
    if (!job) throw new NotFoundException(`Không tìm thấy job nền với ID ${backgroundJobId}`)

    return BaseResponseDto.success('Lấy chi tiết job nền thành công', BackgroundJobResponseDto.fromBackgroundJob(job))
  }
}

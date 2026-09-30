import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetNotificationDispatchJobUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}
  async execute(id: number) {
    const job = await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDispatchJobRepository.findDetailById(id),
    )
    if (!job) throw new NotFoundException('Không tìm thấy notification job')
    return BaseResponseDto.success('Lấy chi tiết notification job thành công', job)
  }
}

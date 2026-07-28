import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskProductSubmissionResponseDto, BaseResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetAssistantTaskProductSubmissionUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantTaskProductSubmissionId: number) {
    const submission = await this.uow.executeInTransaction((repos) =>
      repos.assistantTaskProductSubmissionRepository.findById(assistantTaskProductSubmissionId),
    )
    if (!submission) throw new NotFoundException('Lần nộp sản phẩm không tồn tại')

    return BaseResponseDto.success(
      'Lấy lần nộp sản phẩm thành công',
      new AssistantTaskProductSubmissionResponseDto(submission),
    )
  }
}

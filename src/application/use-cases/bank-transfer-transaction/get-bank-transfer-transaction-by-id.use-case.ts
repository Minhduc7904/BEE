import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto, BankTransferTransactionDetailResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetBankTransferTransactionByIdUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    bankTransferTransactionId: number,
  ): Promise<BaseResponseDto<BankTransferTransactionDetailResponseDto>> {
    const transaction = await this.unitOfWork.executeInTransaction((repos) =>
      repos.bankTransferTransactionRepository.findById(bankTransferTransactionId),
    )

    if (!transaction) {
      throw new NotFoundException(
        `Không tìm thấy giao dịch chuyển khoản với ID ${bankTransferTransactionId}`,
      )
    }

    return BaseResponseDto.success(
      'Lấy chi tiết giao dịch chuyển khoản thành công',
      BankTransferTransactionDetailResponseDto.fromBankTransferTransaction(transaction),
    )
  }
}

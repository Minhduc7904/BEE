import { Inject, Injectable } from '@nestjs/common'

import {
  BankTransferTransactionStatisticsQueryDto,
  BankTransferTransactionStatisticsResponseDto,
  BaseResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetBankTransferTransactionStatisticsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    query: BankTransferTransactionStatisticsQueryDto,
  ): Promise<BaseResponseDto<BankTransferTransactionStatisticsResponseDto>> {
    const statistics = await this.unitOfWork.executeInTransaction((repos) =>
      repos.bankTransferTransactionRepository.getStatistics(
        query.toBankTransferTransactionListOptions(),
      ),
    )

    return BaseResponseDto.success(
      'Lấy thống kê giao dịch chuyển khoản thành công',
      BankTransferTransactionStatisticsResponseDto.fromStatistics(statistics),
    )
  }
}

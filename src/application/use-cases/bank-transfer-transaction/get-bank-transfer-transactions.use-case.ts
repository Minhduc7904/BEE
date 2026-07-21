import { Inject, Injectable } from '@nestjs/common'

import {
  BankTransferTransactionListQueryDto,
  BankTransferTransactionResponseDto,
  PaginationResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetBankTransferTransactionsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    query: BankTransferTransactionListQueryDto,
  ): Promise<PaginationResponseDto<BankTransferTransactionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const options = query.toBankTransferTransactionListOptions()
      const [transactions, total] = await Promise.all([
        repos.bankTransferTransactionRepository.findAll(options),
        repos.bankTransferTransactionRepository.count(options),
      ])

      return {
        data: BankTransferTransactionResponseDto.fromBankTransferTransactionList(transactions),
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách giao dịch chuyển khoản thành công',
      result.data,
      result.page,
      result.limit,
      result.total,
    )
  }
}

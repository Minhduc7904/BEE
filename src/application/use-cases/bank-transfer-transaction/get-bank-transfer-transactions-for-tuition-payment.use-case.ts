import { Inject, Injectable } from '@nestjs/common'

import {
  BankTransferTransactionListQueryDto,
  BankTransferTransactionResponseDto,
  PaginationResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetBankTransferTransactionsForTuitionPaymentUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    tuitionPaymentId: number,
    query: BankTransferTransactionListQueryDto,
    canViewSensitiveAccountNumber: boolean,
  ): Promise<PaginationResponseDto<BankTransferTransactionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
      if (!tuitionPayment) throw new NotFoundException(`Không tìm thấy học phí với ID ${tuitionPaymentId}`)

      const paymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
      const paymentAttempts = paymentIntent
        ? await repos.paymentAttemptRepository.findAll({ paymentIntentId: paymentIntent.paymentIntentId })
        : []
      const { paymentAttemptId: _paymentAttemptId, ...options } = query.toBankTransferTransactionListOptions()
      const listOptions = {
        ...options,
        paymentAttemptIdsOrUnassigned: paymentAttempts.map((paymentAttempt) => paymentAttempt.paymentAttemptId),
        includeReceivingBankAccount: true,
      }
      const [transactions, total] = await Promise.all([
        repos.bankTransferTransactionRepository.findAll(listOptions),
        repos.bankTransferTransactionRepository.count(listOptions),
      ])

      return {
        data: BankTransferTransactionResponseDto.fromBankTransferTransactionList(
          transactions,
          canViewSensitiveAccountNumber,
        ),
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách giao dịch chuyển khoản cho học phí thành công',
      result.data,
      result.page,
      result.limit,
      result.total,
    )
  }
}

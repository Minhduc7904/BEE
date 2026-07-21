import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentDetailResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ForbiddenException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class GetTuitionPaymentByIdUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    tuitionPaymentId: number,
    studentId?: number,
  ): Promise<BaseResponseDto<TuitionPaymentDetailResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
      if (studentId && tuitionPayment?.studentId !== studentId) {
        throw new ForbiddenException('Bạn không có quyền truy cập học phí này')
      }

      if (!tuitionPayment) {
        throw new NotFoundException(`Học phí với ID ${tuitionPaymentId} không tồn tại`)
      }

      const paymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
      if (!paymentIntent) {
        return TuitionPaymentDetailResponseDto.fromTuitionPayment(tuitionPayment, null, [])
      }

      const paymentAttempts = await repos.paymentAttemptRepository.findAll({
        paymentIntentId: paymentIntent.paymentIntentId,
      })
      const bankTransferTransactions = paymentAttempts.length > 0
        ? await repos.bankTransferTransactionRepository.findAll({
            paymentAttemptIds: paymentAttempts.map((paymentAttempt) => paymentAttempt.paymentAttemptId),
          })
        : []
      const transactionsByAttemptId = new Map<number, typeof bankTransferTransactions>()
      for (const transaction of bankTransferTransactions) {
        if (!transaction.paymentAttemptId) continue
        const transactions = transactionsByAttemptId.get(transaction.paymentAttemptId) ?? []
        transactions.push(transaction)
        transactionsByAttemptId.set(transaction.paymentAttemptId, transactions)
      }

      return TuitionPaymentDetailResponseDto.fromTuitionPayment(
        tuitionPayment,
        paymentIntent,
        paymentAttempts.map((paymentAttempt) => ({
          paymentAttempt,
          bankTransferTransactions: transactionsByAttemptId.get(paymentAttempt.paymentAttemptId) ?? [],
        })),
      )
    })

    return BaseResponseDto.success('Lấy chi tiết học phí thành công', response)
  }
}

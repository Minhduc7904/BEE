import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import {
  BaseResponseDto,
  TuitionPaymentResponseDto,
  UpdateManualTuitionPaymentReconciliationDto,
} from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories/unit-of-work.repository'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus, PaymentIntentStatus, TuitionPaymentStatus } from 'src/shared/enums'
import {
  InvalidStateException,
  NotFoundException,
  UnauthorizedException,
} from 'src/shared/exceptions/custom-exceptions'
import { ManualTuitionPaymentReconciliationService } from './manual-tuition-payment-reconciliation.service'

@Injectable()
export class UpdateManualTuitionPaymentReconciliationUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly manualReconciliation: ManualTuitionPaymentReconciliationService,
  ) {}

  async execute(
    tuitionPaymentId: number,
    dto: UpdateManualTuitionPaymentReconciliationDto,
    adminId?: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    if (!adminId) throw new UnauthorizedException('Admin không hợp lệ')

    const response = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
        if (!tuitionPayment) throw new NotFoundException(`Không tìm thấy học phí với ID ${tuitionPaymentId}`)

        if (tuitionPayment.status !== TuitionPaymentStatus.PAID) {
          throw new InvalidStateException('Chỉ có thể sửa đối soát của học phí đã thanh toán')
        }

        const paymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
        if (!paymentIntent)
          throw new NotFoundException(`Không tìm thấy payment intent của học phí với ID ${tuitionPaymentId}`)

        const selectedTransactionIds = this.manualReconciliation.normalizeBankTransferTransactionIds(
          dto.bankTransferTransactionIds,
        )
        const paymentAttempts = await repos.paymentAttemptRepository.findAll({
          paymentIntentId: paymentIntent.paymentIntentId,
        })
        const currentTransactions = await repos.bankTransferTransactionRepository.findAll({
          paymentAttemptIds: paymentAttempts.map((paymentAttempt) => paymentAttempt.paymentAttemptId),
        })
        const currentTransactionIdSet = new Set(
          currentTransactions.map((transaction) => transaction.bankTransferTransactionId),
        )
        const retainedTransactionIds = selectedTransactionIds.filter((transactionId) =>
          currentTransactionIdSet.has(transactionId),
        )
        const newTransactionIds = selectedTransactionIds.filter(
          (transactionId) => !currentTransactionIdSet.has(transactionId),
        )

        const selectedTransactionIdSet = new Set(selectedTransactionIds)
        const hasChanges =
          newTransactionIds.length > 0 ||
          currentTransactions.some(
            (transaction) => !selectedTransactionIdSet.has(transaction.bankTransferTransactionId),
          )
        if (!hasChanges) return new TuitionPaymentResponseDto(tuitionPayment)

        const pendingPaymentIntent = await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, {
          status: PaymentIntentStatus.PENDING,
        })
        const releasedTransactions = await this.manualReconciliation.releaseBankTransferTransactions(
          repos,
          paymentIntent.paymentIntentId,
          retainedTransactionIds,
        )
        const reconciliation =
          newTransactionIds.length > 0
            ? await this.manualReconciliation.reconcileBankTransferTransactions(
                repos,
                pendingPaymentIntent,
                newTransactionIds,
              )
            : null
        const updatedPaymentIntent = await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, {
          status: PaymentIntentStatus.PAID,
        })

        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.TUITION_PAYMENT.CONFIRM_MANUAL_PAYMENT,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
          resourceId: String(tuitionPaymentId),
          beforeData: {
            operation: 'UPDATE_MANUAL_RECONCILIATION',
            paymentIntent: { paymentIntentId: paymentIntent.paymentIntentId, status: paymentIntent.status },
            bankTransferTransactions: currentTransactions,
          },
          afterData: {
            paymentIntent: {
              paymentIntentId: updatedPaymentIntent.paymentIntentId,
              status: updatedPaymentIntent.status,
            },
            releasedBankTransferTransactions: releasedTransactions,
            reconciledBankTransferTransactions: reconciliation?.updatedTransactions ?? [],
            retainedTransactionIds,
            newTransactionIds,
          },
        })

        return new TuitionPaymentResponseDto(tuitionPayment)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Cập nhật đối soát học phí thành công', response)
  }
}

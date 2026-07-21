import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { BaseResponseDto, TuitionPaymentResponseDto } from 'src/application/dtos'
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
export class UnreconcileManualTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly manualReconciliation: ManualTuitionPaymentReconciliationService,
  ) {}

  async execute(tuitionPaymentId: number, adminId?: number): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    if (!adminId) throw new UnauthorizedException('Admin không hợp lệ')

    const response = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
        if (!tuitionPayment) throw new NotFoundException(`Không tìm thấy học phí với ID ${tuitionPaymentId}`)

        if (tuitionPayment.status !== TuitionPaymentStatus.PAID) {
          throw new InvalidStateException('Chỉ có thể bỏ đối soát học phí đã thanh toán')
        }

        const paymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
        if (!paymentIntent)
          throw new NotFoundException(`Không tìm thấy payment intent của học phí với ID ${tuitionPaymentId}`)

        const paymentAttempts = await repos.paymentAttemptRepository.findAll({
          paymentIntentId: paymentIntent.paymentIntentId,
        })
        const beforeTransactions = await repos.bankTransferTransactionRepository.findAll({
          paymentAttemptIds: paymentAttempts.map((paymentAttempt) => paymentAttempt.paymentAttemptId),
        })
        const releasedTransactions = await this.manualReconciliation.releaseBankTransferTransactions(
          repos,
          paymentIntent.paymentIntentId,
        )
        const updatedPaymentIntent = await repos.paymentIntentRepository.update(paymentIntent.paymentIntentId, {
          status: PaymentIntentStatus.PENDING,
        })
        const updatedTuitionPayment = await repos.tuitionPaymentRepository.update(tuitionPaymentId, {
          status: TuitionPaymentStatus.UNPAID,
          paidAt: null,
        })
        if (!updatedTuitionPayment) throw new NotFoundException(`Không tìm thấy học phí với ID ${tuitionPaymentId}`)

        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.TUITION_PAYMENT.CONFIRM_MANUAL_PAYMENT,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
          resourceId: String(tuitionPaymentId),
          beforeData: {
            operation: 'UNRECONCILE_MANUAL_PAYMENT',
            tuitionPayment: { status: tuitionPayment.status, paidAt: tuitionPayment.paidAt },
            paymentIntent: { paymentIntentId: paymentIntent.paymentIntentId, status: paymentIntent.status },
            bankTransferTransactions: beforeTransactions,
          },
          afterData: {
            tuitionPayment: { status: updatedTuitionPayment.status, paidAt: updatedTuitionPayment.paidAt },
            paymentIntent: {
              paymentIntentId: updatedPaymentIntent.paymentIntentId,
              status: updatedPaymentIntent.status,
            },
            bankTransferTransactions: releasedTransactions,
          },
        })

        return new TuitionPaymentResponseDto(updatedTuitionPayment)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Bỏ đối soát học phí thành công', response)
  }
}

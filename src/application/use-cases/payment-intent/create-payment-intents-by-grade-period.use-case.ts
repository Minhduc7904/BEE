import { Inject, Injectable } from '@nestjs/common'

import {
  BaseResponseDto,
  CreatePaymentIntentsByGradePeriodDto,
  CreatePaymentIntentsByGradePeriodResponseDto,
  PaymentIntentResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus, TuitionPaymentStatus } from '../../../shared/enums'
import { TuitionPaymentIntentEligibility } from './tuition-payment-intent-eligibility'

@Injectable()
export class CreatePaymentIntentsByGradePeriodUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    dto: CreatePaymentIntentsByGradePeriodDto,
    adminId: number,
  ): Promise<BaseResponseDto<CreatePaymentIntentsByGradePeriodResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const payments = await repos.tuitionPaymentRepository.findWithFilter({
        month: dto.month,
        year: dto.year,
        status: TuitionPaymentStatus.UNPAID,
      })
      const eligiblePayments = payments.filter((payment) =>
        payment.student?.grade === dto.grade && payment.amount !== null && payment.amount > 0,
      )
      const created: PaymentIntentResponseDto[] = []
      let existingPaymentIntentCount = 0

      for (const tuitionPayment of eligiblePayments) {
        const existing = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPayment.paymentId)
        if (existing) {
          existingPaymentIntentCount += 1
          continue
        }

        const paymentIntent = await repos.paymentIntentRepository.create({
          tuitionPaymentId: tuitionPayment.paymentId,
          amount: tuitionPayment.amount!,
          currency: 'VND',
          expiresAt: null,
        })
        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.PAYMENT_INTENT.CREATE_BULK,
          resourceType: RESOURCE_TYPES.PAYMENT_INTENT,
          resourceId: String(paymentIntent.paymentIntentId),
          status: AuditStatus.SUCCESS,
          afterData: this.toAuditData(paymentIntent),
        })
        created.push(PaymentIntentResponseDto.fromPaymentIntent(paymentIntent))
      }

      return {
        totalEligible: eligiblePayments.length,
        created,
        existingPaymentIntentCount,
      }
    })

    return BaseResponseDto.success('Tạo payment intent theo khối và kỳ học thành công', response)
  }

  private toAuditData(
    paymentIntent: { paymentIntentId: number; tuitionPaymentId: number; amount: number; currency: string; status: string },
  ) {
    return {
      paymentIntentId: paymentIntent.paymentIntentId,
      tuitionPaymentId: paymentIntent.tuitionPaymentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    }
  }
}

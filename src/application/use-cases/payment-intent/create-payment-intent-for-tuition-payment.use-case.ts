import { Inject, Injectable } from '@nestjs/common'

import {
  BaseResponseDto,
  CreatePaymentIntentResponseDto,
  PaymentIntentResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { AuditStatus } from '../../../shared/enums'
import { TuitionPaymentIntentEligibility } from './tuition-payment-intent-eligibility'

@Injectable()
export class CreatePaymentIntentForTuitionPaymentUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    tuitionPaymentId: number,
    adminId: number,
  ): Promise<BaseResponseDto<CreatePaymentIntentResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
      if (!tuitionPayment) {
        throw new NotFoundException(`Không tìm thấy học phí với ID ${tuitionPaymentId}`)
      }

      TuitionPaymentIntentEligibility.assertPayable(tuitionPayment)
      const existing = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
      if (existing) {
        return {
          created: false,
          paymentIntent: PaymentIntentResponseDto.fromPaymentIntent(existing),
        }
      }

      const paymentIntent = await repos.paymentIntentRepository.create({
        tuitionPaymentId,
        amount: tuitionPayment.amount!,
        currency: 'VND',
        expiresAt: null,
      })

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.PAYMENT_INTENT.CREATE,
        resourceType: RESOURCE_TYPES.PAYMENT_INTENT,
        resourceId: String(paymentIntent.paymentIntentId),
        status: AuditStatus.SUCCESS,
        afterData: this.toAuditData(paymentIntent),
      })

      return {
        created: true,
        paymentIntent: PaymentIntentResponseDto.fromPaymentIntent(paymentIntent),
      }
    })

    return BaseResponseDto.success(
      response.created ? 'Tạo payment intent cho học phí thành công' : 'Payment intent của học phí đã tồn tại',
      response,
    )
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

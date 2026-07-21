import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto, CancelPaymentAttemptResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { PaymentAttemptStatus } from '../../../shared/enums'
import { InvalidStateException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class CancelMyPaymentAttemptUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    tuitionPaymentId: number,
    paymentAttemptId: number,
    studentId: number,
  ): Promise<BaseResponseDto<CancelPaymentAttemptResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
      if (!tuitionPayment || tuitionPayment.studentId !== studentId) {
        throw new NotFoundException(`Không tìm thấy học phí với ID ${tuitionPaymentId}`)
      }

      const paymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
      const paymentAttempt = await repos.paymentAttemptRepository.findById(paymentAttemptId)
      if (!paymentIntent || !paymentAttempt || paymentAttempt.paymentIntentId !== paymentIntent.paymentIntentId) {
        throw new NotFoundException(`Không tìm thấy giao dịch thanh toán với ID ${paymentAttemptId}`)
      }

      if (paymentAttempt.status !== PaymentAttemptStatus.PENDING) {
        throw new InvalidStateException('Chỉ có thể hủy giao dịch đang chờ thanh toán')
      }

      const cancelled = await repos.paymentAttemptRepository.update(paymentAttemptId, {
        status: PaymentAttemptStatus.CANCELLED,
        expiresAt: new Date(),
      })
      return CancelPaymentAttemptResponseDto.fromPaymentAttempt(cancelled)
    })

    return BaseResponseDto.success('Hủy giao dịch thanh toán thành công', response)
  }
}

import type { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import type { UnitOfWorkRepos } from '../../../domain/repositories'
import { PaymentIntentStatus, TuitionPaymentStatus } from '../../../shared/enums'
import { BusinessLogicException } from '../../../shared/exceptions/custom-exceptions'

/**
 * Tạo nghĩa vụ thanh toán đồng bộ với bản ghi học phí vừa được tạo.
 * PaymentIntent không có số tiền nullable, vì vậy học phí mới phải có số tiền
 * đã xác định trước khi transaction tạo học phí có thể hoàn tất.
 */
export class CreatePaymentIntentForCreatedTuitionPayment {
  static async execute(
    repos: Pick<UnitOfWorkRepos, 'paymentIntentRepository'>,
    tuitionPayment: TuitionPayment,
  ) {
    if (tuitionPayment.amount === null) {
      throw new BusinessLogicException(
        'Không thể tạo học phí khi chưa xác định số tiền, vì payment intent cần số tiền thanh toán',
      )
    }

    return repos.paymentIntentRepository.create({
      tuitionPaymentId: tuitionPayment.paymentId,
      amount: tuitionPayment.amount,
      currency: 'VND',
      expiresAt: null,
      status: tuitionPayment.status === TuitionPaymentStatus.PAID
        ? PaymentIntentStatus.PAID
        : PaymentIntentStatus.PENDING,
    })
  }
}

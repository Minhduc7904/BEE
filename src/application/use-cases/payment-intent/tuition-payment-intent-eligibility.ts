import type { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import {
  TuitionPaymentStatus,
} from '../../../shared/enums'
import {
  BusinessLogicException,
  InvalidStateException,
} from '../../../shared/exceptions/custom-exceptions'

export class TuitionPaymentIntentEligibility {
  static assertPayable(tuitionPayment: TuitionPayment): void {
    if (tuitionPayment.status !== TuitionPaymentStatus.UNPAID) {
      throw new InvalidStateException(`Học phí ${tuitionPayment.paymentId} không còn ở trạng thái chưa thanh toán`)
    }

    if (tuitionPayment.amount === null || tuitionPayment.amount <= 0) {
      throw new BusinessLogicException(`Học phí ${tuitionPayment.paymentId} chưa có số tiền thanh toán hợp lệ`)
    }
  }
}

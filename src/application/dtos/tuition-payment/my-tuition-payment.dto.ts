import { PaymentIntent } from 'src/domain/entities/tuition-online-payment'
import { TuitionPayment } from 'src/domain/entities/tuition-payment/tuition-payment.entity'
import { PaymentIntentResponseDto } from '../payment-intent/payment-intent.dto'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { TuitionPaymentResponseDto } from './tuition-payment.dto'

export class MyTuitionPaymentResponseDto extends TuitionPaymentResponseDto {
  paymentIntent: PaymentIntentResponseDto | null

  constructor(tuitionPayment: TuitionPayment, paymentIntent: PaymentIntent | null) {
    super(tuitionPayment)
    this.paymentIntent = paymentIntent ? PaymentIntentResponseDto.fromPaymentIntent(paymentIntent) : null
  }
}

export class MyTuitionPaymentListResponseDto extends PaginationResponseDto<MyTuitionPaymentResponseDto> {
  constructor(data: MyTuitionPaymentResponseDto[], page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit)
    super(true, 'L\u1ea5y danh s\u00e1ch h\u1ecdc ph\u00ed th\u00e0nh c\u00f4ng', data, {
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
      previousPage: page > 1 ? page - 1 : undefined,
      nextPage: page < totalPages ? page + 1 : undefined,
    })
  }
}

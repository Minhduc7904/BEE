// Nạp barrel trước để tránh phụ thuộc vòng giữa các DTO học phí/khóa học khi import trực tiếp từng tệp.
import '../index'
import { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import { TuitionPaymentStatus } from '../../../shared/enums'
import { AdminTuitionPaymentResponseDto } from './admin-tuition-payment.dto'
import { MyTuitionPaymentResponseDto } from './my-tuition-payment.dto'
import { TuitionPaymentDetailResponseDto } from './tuition-payment-detail.dto'

const REPORTED_AT = new Date('2026-10-16T03:00:00.000Z')

function payment(reported: boolean): TuitionPayment {
  return new TuitionPayment({
    paymentId: 7,
    studentId: 12,
    amount: 1_500_000,
    status: TuitionPaymentStatus.UNPAID,
    month: 10,
    year: 2026,
    payerReportedTransferredAt: reported ? REPORTED_AT : null,
    payerReportedTransferredByUserId: reported ? 10 : null,
  })
}

describe('payer-reported transfer in admin DTOs', () => {
  it('exposes the flag, time and reporter on the admin list item', () => {
    expect(new AdminTuitionPaymentResponseDto(payment(true), null)).toMatchObject({
      payerReportedTransferred: true,
      payerReportedTransferredAt: REPORTED_AT,
      payerReportedTransferredByUserId: 10,
    })
  })

  it('reports "not reported" with null time and reporter', () => {
    expect(new AdminTuitionPaymentResponseDto(payment(false), null)).toMatchObject({
      payerReportedTransferred: false,
      payerReportedTransferredAt: null,
      payerReportedTransferredByUserId: null,
    })
  })

  it('exposes the flag on the admin detail', () => {
    expect(TuitionPaymentDetailResponseDto.fromTuitionPayment(payment(true), null, [])).toMatchObject({
      payerReportedTransferred: true,
      payerReportedTransferredAt: REPORTED_AT,
      payerReportedTransferredByUserId: 10,
    })
  })

  it('does not leak the flag to the student API', () => {
    const response = new MyTuitionPaymentResponseDto(payment(true), null)

    expect(response).not.toHaveProperty('payerReportedTransferred')
    expect(response).not.toHaveProperty('payerReportedTransferredAt')
    expect(response).not.toHaveProperty('payerReportedTransferredByUserId')
  })
})

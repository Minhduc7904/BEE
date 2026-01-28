// tuition-payment-stats-response.dto.ts
export class TuitionPaymentStatsResponseDto {
  paid: number
  unpaid: number
  total: number

  constructor(data: { paid: number; unpaid: number }) {
    this.paid = data.paid
    this.unpaid = data.unpaid
    this.total = data.paid + data.unpaid
  }
}

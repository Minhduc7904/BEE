// src/application/dtos/tuition-payment/tuition-payment-money-stats-response.dto.ts

export class TuitionPaymentMoneyStatsResponseDto {
  collected: number
  uncollected: number
  expected: number

  constructor(data: { collected: number; uncollected: number; expected: number }) {
    this.collected = data.collected
    this.uncollected = data.uncollected
    this.expected = data.expected
  }
}

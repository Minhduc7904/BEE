import { IsRequiredIdNumber } from 'src/shared/decorators/validate'

export class CreatePayosPaymentDto {
  @IsRequiredIdNumber('ID hoa don')
  invoiceId: number
}

export interface PayosPaymentResponseDto {
  invoiceId: number
  invoiceCode: string
  attemptId: number
  attemptCode: string
  orderCode: number
  paymentLinkId: string
  amount: number
  currency: string
  qrContent: string
  paymentUrl: string
  expiresAt: Date
  status: string
}

export interface PayosWebhookResponseDto {
  code: string
  desc: string
}

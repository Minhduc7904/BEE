import { IsRequiredIdNumber } from 'src/shared/decorators/validate'

export class CreateVnpayQrPaymentDto {
  @IsRequiredIdNumber('ID hoa don')
  invoiceId: number
}

export interface VnpayQrPaymentResponseDto {
  invoiceId: number
  invoiceCode: string
  attemptId: number
  attemptCode: string
  amount: number
  currency: string
  qrContent?: string | null
  paymentUrl?: string | null
  expiresAt: Date
  status: string
}

export interface VnpayIpnResponseDto {
  RspCode: string
  Message: string
}

export interface VnpayReturnResponseDto {
  isVerified: boolean
  isSuccess: boolean
  txnRef?: string
  amount?: number
  responseCode?: string
  transactionStatus?: string
  message?: string
}

export interface OnlineCourseInvoicePaymentStatusResponseDto {
  invoiceId: number
  invoiceCode: string
  status: string
  paidAt?: Date | null
  paidAmount: number
  latestAttempt?: {
    attemptCode: string
    status: string
    provider: string
  } | null
  enrollmentCreated: boolean
}

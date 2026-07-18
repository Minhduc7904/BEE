/** Application port and Nest injection token for PayosService. */
export abstract class PayosService {}

export interface CreatePayosPaymentItem {
  name: string
  quantity: number
  price: number
}

export interface CreatePayosPaymentLinkInput {
  orderCode: number
  amount: number
  description: string
  items: CreatePayosPaymentItem[]
  expiredAt: number
}

export interface PayosPaymentLink {
  paymentLinkId: string
  orderCode: number
  amount: number
  status: string
  checkoutUrl: string
  qrCode: string
}

export interface PayosWebhookData {
  orderCode: number
  amount: number
  description?: string
  reference?: string
  transactionDateTime?: string
  currency?: string
  paymentLinkId?: string
  code?: string
  desc?: string
  counterAccountBankId?: string
  counterAccountBankName?: string
  counterAccountName?: string
  counterAccountNumber?: string
}

export interface PayosWebhookEvent {
  code: string
  desc: string
  success: boolean
  data: PayosWebhookData
}

export interface PayosService {
  createPaymentLink(input: CreatePayosPaymentLinkInput): Promise<PayosPaymentLink>
  verifyWebhook(payload: unknown): PayosWebhookEvent
}

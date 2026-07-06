// src/shared/enums/online-payment-provider.enum.ts

export enum OnlinePaymentProvider {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
  PAYOS = 'PAYOS',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export const OnlinePaymentProviderLabels: Record<OnlinePaymentProvider, string> = {
  [OnlinePaymentProvider.VNPAY]: 'VNPay',
  [OnlinePaymentProvider.MOMO]: 'MoMo',
  [OnlinePaymentProvider.ZALOPAY]: 'ZaloPay',
  [OnlinePaymentProvider.PAYOS]: 'PayOS',
  [OnlinePaymentProvider.STRIPE]: 'Stripe',
  [OnlinePaymentProvider.BANK_TRANSFER]: 'Chuyen khoan ngan hang',
  [OnlinePaymentProvider.OTHER]: 'Khac',
}

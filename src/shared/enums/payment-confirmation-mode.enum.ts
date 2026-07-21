export enum PaymentConfirmationMode {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL_FALLBACK = 'MANUAL_FALLBACK',
}

export const PaymentConfirmationModeLabels: Record<PaymentConfirmationMode, string> = {
  [PaymentConfirmationMode.AUTOMATIC]: 'Xác nhận tự động',
  [PaymentConfirmationMode.MANUAL_FALLBACK]: 'Xác nhận thủ công',
}

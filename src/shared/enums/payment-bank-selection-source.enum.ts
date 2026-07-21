export enum PaymentBankSelectionSource {
  GRADE_MAPPING = 'GRADE_MAPPING',
  MANUAL_DEFAULT = 'MANUAL_DEFAULT',
}

export const PaymentBankSelectionSourceLabels: Record<PaymentBankSelectionSource, string> = {
  [PaymentBankSelectionSource.GRADE_MAPPING]: 'Cấu hình theo khối',
  [PaymentBankSelectionSource.MANUAL_DEFAULT]: 'Tài khoản thủ công mặc định',
}

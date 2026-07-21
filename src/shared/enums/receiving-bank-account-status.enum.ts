export enum ReceivingBankAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const ReceivingBankAccountStatusLabels: Record<ReceivingBankAccountStatus, string> = {
  [ReceivingBankAccountStatus.ACTIVE]: 'Đang sử dụng',
  [ReceivingBankAccountStatus.INACTIVE]: 'Ngừng sử dụng',
}

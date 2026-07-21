/**
 * Đồng bộ với Prisma schema enum SepayBankAccountStatus.
 * UNKNOWN biểu thị tài khoản chưa từng được SePay xác nhận, nên không được dùng để xác nhận tự động.
 */
export enum SepayBankAccountStatus {
  UNKNOWN = 'UNKNOWN',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const SepayBankAccountStatusLabels: Record<SepayBankAccountStatus, string> = {
  [SepayBankAccountStatus.UNKNOWN]: 'Chưa đồng bộ SePay',
  [SepayBankAccountStatus.ACTIVE]: 'Đang hoạt động trên SePay',
  [SepayBankAccountStatus.INACTIVE]: 'Tạm khóa trên SePay',
}

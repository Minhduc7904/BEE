/**
 * Đồng bộ với Prisma enum BankTransferReconciliationStatus.
 * Cho biết giao dịch ngân hàng chưa được đối soát, đã được BE tự đối soát,
 * hay đã được quản trị viên đối soát thủ công.
 */
export enum BankTransferReconciliationStatus {
  UNRECONCILED = 'UNRECONCILED',
  AUTOMATIC = 'AUTOMATIC',
  ADMIN = 'ADMIN',
}

export const BankTransferReconciliationStatusLabels: Record<BankTransferReconciliationStatus, string> = {
  [BankTransferReconciliationStatus.UNRECONCILED]: 'Chưa đối soát',
  [BankTransferReconciliationStatus.AUTOMATIC]: 'Đã tự động đối soát',
  [BankTransferReconciliationStatus.ADMIN]: 'Đã được quản trị viên đối soát',
}

export enum BankTransferProcessingStatus {
  RECEIVED = 'RECEIVED',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  IGNORED = 'IGNORED',
  ERROR = 'ERROR',
}

export const BankTransferProcessingStatusLabels: Record<BankTransferProcessingStatus, string> = {
  [BankTransferProcessingStatus.RECEIVED]: 'Đã nhận',
  [BankTransferProcessingStatus.MATCHED]: 'Đã khớp',
  [BankTransferProcessingStatus.UNMATCHED]: 'Chưa khớp',
  [BankTransferProcessingStatus.AMOUNT_MISMATCH]: 'Sai số tiền',
  [BankTransferProcessingStatus.IGNORED]: 'Đã bỏ qua',
  [BankTransferProcessingStatus.ERROR]: 'Lỗi xử lý',
}

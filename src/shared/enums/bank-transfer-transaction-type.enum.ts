export enum BankTransferTransactionType {
  TUITION_PAYMENT = 'TUITION_PAYMENT',
  COURSE_PURCHASE = 'COURSE_PURCHASE',
}

export const BankTransferTransactionTypeLabels: Record<BankTransferTransactionType, string> = {
  [BankTransferTransactionType.TUITION_PAYMENT]: 'Thu học phí',
  [BankTransferTransactionType.COURSE_PURCHASE]: 'Mua khóa học',
}

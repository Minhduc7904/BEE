import type { BankTransferTransaction as PrismaBankTransferTransaction } from '@prisma/client'

import { BankTransferTransaction } from '../../../domain/entities/tuition-online-payment'
import type { JsonPayload } from '../../../domain/interface/tuition-online-payment'
import {
  BankTransferProcessingStatus,
  BankTransferProvider,
  BankTransferReconciliationStatus,
} from '../../../shared/enums'

export class BankTransferTransactionMapper {
  static toDomain(
    prismaBankTransferTransaction: PrismaBankTransferTransaction | null | undefined,
  ): BankTransferTransaction | null {
    if (!prismaBankTransferTransaction) return null

    return new BankTransferTransaction({
      bankTransferTransactionId: prismaBankTransferTransaction.bankTransferTransactionId,
      provider: prismaBankTransferTransaction.provider as BankTransferProvider,
      providerTransactionId: prismaBankTransferTransaction.providerTransactionId,
      sepayV2TransactionId: prismaBankTransferTransaction.sepayV2TransactionId,
      paymentAttemptId: prismaBankTransferTransaction.paymentAttemptId,
      receivingBankAccountId: prismaBankTransferTransaction.receivingBankAccountId,
      amount: prismaBankTransferTransaction.amount,
      transactionAt: prismaBankTransferTransaction.transactionAt,
      receivingAccountNumber: prismaBankTransferTransaction.receivingAccountNumber,
      content: prismaBankTransferTransaction.content,
      reference: prismaBankTransferTransaction.reference,
      rawPayload: prismaBankTransferTransaction.rawPayload as JsonPayload | null,
      processingStatus: prismaBankTransferTransaction.processingStatus as BankTransferProcessingStatus,
      reconciliationStatus: prismaBankTransferTransaction.reconciliationStatus as BankTransferReconciliationStatus,
      createdAt: prismaBankTransferTransaction.createdAt,
      updatedAt: prismaBankTransferTransaction.updatedAt,
    })
  }

  static toDomainList(
    prismaBankTransferTransactions: PrismaBankTransferTransaction[] | null | undefined,
  ): BankTransferTransaction[] {
    if (!prismaBankTransferTransactions?.length) return []

    return prismaBankTransferTransactions
      .map((item) => this.toDomain(item))
      .filter((item): item is BankTransferTransaction => item !== null)
  }
}

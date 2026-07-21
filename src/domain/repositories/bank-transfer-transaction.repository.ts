import { BankTransferTransaction } from '../entities/tuition-online-payment'
import {
  BankTransferTransactionListOptions,
  BankTransferTransactionProviderReferenceMatchOptions,
  BankTransferTransactionStatistics,
  CreateBankTransferTransactionData,
  UpdateBankTransferTransactionReconciliationData,
} from '../interface/tuition-online-payment'
import { BankTransferProvider } from '../../shared/enums'

export interface IBankTransferTransactionRepository {
  create(data: CreateBankTransferTransactionData): Promise<BankTransferTransaction>
  findById(bankTransferTransactionId: number): Promise<BankTransferTransaction | null>
  findByProviderTransactionId(
    provider: BankTransferProvider,
    providerTransactionId: string,
  ): Promise<BankTransferTransaction | null>
  findBySepayV2TransactionId(sepayV2TransactionId: string): Promise<BankTransferTransaction | null>
  findAllByProviderReferenceAndMatchCriteria(
    options: BankTransferTransactionProviderReferenceMatchOptions,
  ): Promise<BankTransferTransaction[]>
  findAll(options?: BankTransferTransactionListOptions): Promise<BankTransferTransaction[]>
  count(options?: BankTransferTransactionListOptions): Promise<number>
  getStatistics(options?: BankTransferTransactionListOptions): Promise<BankTransferTransactionStatistics>
  updateReconciliation(
    bankTransferTransactionId: number,
    data: UpdateBankTransferTransactionReconciliationData,
  ): Promise<BankTransferTransaction>
  updateReceivingBankAccountId(
    bankTransferTransactionId: number,
    receivingBankAccountId: number,
  ): Promise<BankTransferTransaction>
  updateSepayV2TransactionId(
    bankTransferTransactionId: number,
    sepayV2TransactionId: string,
  ): Promise<BankTransferTransaction>
}

import { ReceivingBankAccount } from '../entities/tuition-online-payment'
import {
  CreateReceivingBankAccountData,
  ReceivingBankAccountListOptions,
  UpdateReceivingBankAccountData,
} from '../interface/tuition-online-payment'

export interface IReceivingBankAccountRepository {
  create(data: CreateReceivingBankAccountData): Promise<ReceivingBankAccount>
  findById(receivingBankAccountId: number): Promise<ReceivingBankAccount | null>
  findByBankAndAccountNumber(bankCode: string, accountNumber: string): Promise<ReceivingBankAccount | null>
  findAllByAccountNumber(accountNumber: string): Promise<ReceivingBankAccount[]>
  findAllBySepayBankAccountId(sepayBankAccountId: string): Promise<ReceivingBankAccount[]>
  findAll(options?: ReceivingBankAccountListOptions): Promise<ReceivingBankAccount[]>
  count(options?: ReceivingBankAccountListOptions): Promise<number>
  update(receivingBankAccountId: number, data: UpdateReceivingBankAccountData): Promise<ReceivingBankAccount>
}

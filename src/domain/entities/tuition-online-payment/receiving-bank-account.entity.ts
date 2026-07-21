import { ReceivingBankAccountStatus, SepayBankAccountStatus } from '../../../shared/enums'

export class ReceivingBankAccount {
  receivingBankAccountId: number
  bankCode: string
  accountNumber: string
  accountHolder: string
  status: ReceivingBankAccountStatus
  sepayStatus: SepayBankAccountStatus
  createdAt: Date
  updatedAt: Date

  displayName?: string | null
  sepayBankAccountId?: string | null
  notes?: string | null

  constructor(data: {
    receivingBankAccountId: number
    bankCode: string
    accountNumber: string
    accountHolder: string
    status?: ReceivingBankAccountStatus
    sepayStatus?: SepayBankAccountStatus
    displayName?: string | null
    sepayBankAccountId?: string | null
    notes?: string | null
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.receivingBankAccountId = data.receivingBankAccountId
    this.bankCode = data.bankCode
    this.accountNumber = data.accountNumber
    this.accountHolder = data.accountHolder
    this.status = data.status ?? ReceivingBankAccountStatus.ACTIVE
    this.sepayStatus = data.sepayStatus ?? SepayBankAccountStatus.UNKNOWN
    this.displayName = data.displayName ?? null
    this.sepayBankAccountId = data.sepayBankAccountId ?? null
    this.notes = data.notes ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  isActive(): boolean {
    return this.status === ReceivingBankAccountStatus.ACTIVE
  }

  isAvailableForAutomaticCollection(): boolean {
    return this.isActive() && this.sepayStatus === SepayBankAccountStatus.ACTIVE
  }

  isAvailableForManualCollection(): boolean {
    return this.isActive()
  }
}

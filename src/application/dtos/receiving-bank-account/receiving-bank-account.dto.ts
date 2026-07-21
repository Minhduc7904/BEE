import { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'
import { ReceivingBankAccountStatus, SepayBankAccountStatus } from '../../../shared/enums'
import {
  IsOptionalEnumValue,
  IsOptionalString,
  IsRequiredString,
} from '../../../shared/decorators/validate'

export class CreateReceivingBankAccountDto {
  @IsRequiredString('Mã ngân hàng', 30, 2)
  bankCode: string

  @IsRequiredString('Số tài khoản', 50, 3)
  accountNumber: string

  @IsRequiredString('Chủ tài khoản', 150, 2)
  accountHolder: string

  @IsOptionalString('Tên hiển thị', 150)
  displayName?: string

  @IsOptionalString('ID tài khoản SePay', 100)
  sepayBankAccountId?: string

  @IsOptionalString('Ghi chú', 2000)
  notes?: string
}

export class UpdateReceivingBankAccountDto {
  @IsOptionalString('Mã ngân hàng', 30, 2)
  bankCode?: string

  @IsOptionalString('Số tài khoản', 50, 3)
  accountNumber?: string

  @IsOptionalString('Chủ tài khoản', 150, 2)
  accountHolder?: string

  @IsOptionalString('Tên hiển thị', 150)
  displayName?: string

  @IsOptionalString('ID tài khoản SePay', 100)
  sepayBankAccountId?: string

  @IsOptionalString('Ghi chú', 2000)
  notes?: string
}

export class ReceivingBankAccountResponseDto {
  receivingBankAccountId: number
  bankCode: string
  accountNumber: string
  isAccountNumberMasked: boolean
  accountHolder: string
  displayName?: string | null
  status: ReceivingBankAccountStatus
  sepayBankAccountId?: string | null
  sepayStatus: SepayBankAccountStatus
  notes?: string | null
  createdAt: Date
  updatedAt: Date

  static fromReceivingBankAccount(
    account: ReceivingBankAccount,
    canViewSensitiveAccountNumber: boolean,
  ): ReceivingBankAccountResponseDto {
    return {
      receivingBankAccountId: account.receivingBankAccountId,
      bankCode: account.bankCode,
      accountNumber: canViewSensitiveAccountNumber
        ? account.accountNumber
        : this.maskAccountNumber(account.accountNumber),
      isAccountNumberMasked: !canViewSensitiveAccountNumber,
      accountHolder: account.accountHolder,
      displayName: account.displayName,
      status: account.status,
      sepayBankAccountId: account.sepayBankAccountId,
      sepayStatus: account.sepayStatus,
      notes: account.notes,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }
  }

  static fromReceivingBankAccountList(
    accounts: ReceivingBankAccount[],
    canViewSensitiveAccountNumber: boolean,
  ): ReceivingBankAccountResponseDto[] {
    return accounts.map((account) =>
      this.fromReceivingBankAccount(account, canViewSensitiveAccountNumber),
    )
  }

  private static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return '****'

    return `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
  }
}

export class SyncReceivingBankAccountsFromSepayResponseDto {
  total: number
  created: number
  updated: number
  unchanged: number
}

export class ReceivingBankAccountBalanceResponseDto {
  receivingBankAccountId: number
  sepayBankAccountId: string
  bankCode: string
  accountNumber: string
  isAccountNumberMasked: boolean
  balance: string
  currency: 'VND'
  isSepayAccountActive: boolean
  lastTransactionAt?: string | null
  fetchedAt: Date

  static fromSepayBankAccount(input: {
    receivingBankAccountId: number
    sepayBankAccountId: string
    bankCode: string
    accountNumber: string
    balance: string
    isSepayAccountActive: boolean
    lastTransactionAt?: string | null
  }, canViewSensitiveAccountNumber: boolean): ReceivingBankAccountBalanceResponseDto {
    return {
      receivingBankAccountId: input.receivingBankAccountId,
      sepayBankAccountId: input.sepayBankAccountId,
      bankCode: input.bankCode,
      accountNumber: canViewSensitiveAccountNumber
        ? input.accountNumber
        : this.maskAccountNumber(input.accountNumber),
      isAccountNumberMasked: !canViewSensitiveAccountNumber,
      balance: input.balance,
      currency: 'VND',
      isSepayAccountActive: input.isSepayAccountActive,
      lastTransactionAt: input.lastTransactionAt,
      fetchedAt: new Date(),
    }
  }

  private static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return '****'

    return `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
  }
}

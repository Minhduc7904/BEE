import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator'

import { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'
import {
  PaymentConfirmationMode,
  TuitionGradeBankFallbackReason,
} from '../../../shared/enums'
import {
  IsRequiredInt,
  IsRequiredNullableIdNumber,
} from '../../../shared/decorators/validate'
import { ReceivingBankAccountResponseDto } from '../receiving-bank-account/receiving-bank-account.dto'

export class UpdateTuitionGradeBankAccountItemDto {
  @IsRequiredInt('Khối', 1, 12)
  grade: number

  @IsRequiredNullableIdNumber('ID tài khoản nhận tiền')
  receivingBankAccountId: number | null
}

export class UpdateTuitionGradeBankAccountsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateTuitionGradeBankAccountItemDto)
  mappings: UpdateTuitionGradeBankAccountItemDto[]
}

export class TuitionGradeBankAccountResponseDto {
  tuitionGradeReceivingBankAccountId: number
  grade: number
  receivingBankAccountId?: number | null
  receivingBankAccount?: ReceivingBankAccountResponseDto | null
  confirmationMode: PaymentConfirmationMode
  fallbackReason?: TuitionGradeBankFallbackReason | null
  defaultManualReceivingBankAccountId?: number | null
  defaultManualReceivingBankAccount?: ReceivingBankAccountResponseDto | null
  isManualFallbackAvailable: boolean

  static fromData(input: {
    tuitionGradeReceivingBankAccountId: number
    grade: number
    receivingBankAccountId?: number | null
    receivingBankAccount?: ReceivingBankAccount | null
    confirmationMode: PaymentConfirmationMode
    fallbackReason?: TuitionGradeBankFallbackReason | null
    defaultManualReceivingBankAccountId?: number | null
    defaultManualReceivingBankAccount?: ReceivingBankAccount | null
    isManualFallbackAvailable: boolean
  }, canViewSensitiveAccountNumber: boolean): TuitionGradeBankAccountResponseDto {
    return {
      tuitionGradeReceivingBankAccountId: input.tuitionGradeReceivingBankAccountId,
      grade: input.grade,
      receivingBankAccountId: input.receivingBankAccountId ?? null,
      receivingBankAccount: input.receivingBankAccount
        ? ReceivingBankAccountResponseDto.fromReceivingBankAccount(
          input.receivingBankAccount,
          canViewSensitiveAccountNumber,
        )
        : null,
      confirmationMode: input.confirmationMode,
      fallbackReason: input.fallbackReason ?? null,
      defaultManualReceivingBankAccountId: input.defaultManualReceivingBankAccountId ?? null,
      defaultManualReceivingBankAccount: input.defaultManualReceivingBankAccount
        ? ReceivingBankAccountResponseDto.fromReceivingBankAccount(
          input.defaultManualReceivingBankAccount,
          canViewSensitiveAccountNumber,
        )
        : null,
      isManualFallbackAvailable: input.isManualFallbackAvailable,
    }
  }
}

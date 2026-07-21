import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto, TuitionGradeBankAccountResponseDto } from '../../dtos'
import type {
  ReceivingBankAccount,
  TuitionCollectionConfiguration,
  TuitionGradeReceivingBankAccount,
} from '../../../domain/entities/tuition-online-payment'
import type { IUnitOfWork } from '../../../domain/repositories'
import {
  PaymentConfirmationMode,
  SepayBankAccountStatus,
  TuitionGradeBankFallbackReason,
} from '../../../shared/enums'

@Injectable()
export class GetTuitionGradeBankAccountsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    canViewSensitiveAccountNumber: boolean,
  ): Promise<BaseResponseDto<TuitionGradeBankAccountResponseDto[]>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const [mappings, accounts, configuration] = await Promise.all([
        repos.tuitionGradeReceivingBankAccountRepository.findAll(),
        repos.receivingBankAccountRepository.findAll(),
        repos.tuitionCollectionConfigurationRepository.findCurrent(),
      ])

      return this.toResponseList(mappings, accounts, configuration, canViewSensitiveAccountNumber)
    })

    return BaseResponseDto.success('Lấy cấu hình tài khoản nhận tiền theo khối thành công', response)
  }

  private toResponseList(
    mappings: TuitionGradeReceivingBankAccount[],
    accounts: ReceivingBankAccount[],
    configuration: TuitionCollectionConfiguration | null,
    canViewSensitiveAccountNumber: boolean,
  ): TuitionGradeBankAccountResponseDto[] {
    const accountById = new Map(accounts.map((account) => [account.receivingBankAccountId, account]))
    const defaultManualBank = configuration
      ? accountById.get(configuration.defaultManualReceivingBankAccountId) ?? null
      : null

    return mappings.map((mapping) => {
      const receivingBankAccount = mapping.receivingBankAccountId
        ? accountById.get(mapping.receivingBankAccountId) ?? null
        : null
      const fallbackReason = this.getFallbackReason(configuration, receivingBankAccount)

      return TuitionGradeBankAccountResponseDto.fromData(
        {
          tuitionGradeReceivingBankAccountId: mapping.tuitionGradeReceivingBankAccountId,
          grade: mapping.grade,
          receivingBankAccountId: mapping.receivingBankAccountId,
          receivingBankAccount,
          confirmationMode: fallbackReason
            ? PaymentConfirmationMode.MANUAL_FALLBACK
            : PaymentConfirmationMode.AUTOMATIC,
          fallbackReason,
          defaultManualReceivingBankAccountId: configuration?.defaultManualReceivingBankAccountId,
          defaultManualReceivingBankAccount: defaultManualBank,
          isManualFallbackAvailable: defaultManualBank?.isAvailableForManualCollection() ?? false,
        },
        canViewSensitiveAccountNumber,
      )
    })
  }

  private getFallbackReason(
    configuration: TuitionCollectionConfiguration | null,
    receivingBankAccount: ReceivingBankAccount | null,
  ): TuitionGradeBankFallbackReason | null {
    if (!configuration) return TuitionGradeBankFallbackReason.COLLECTION_CONFIGURATION_MISSING
    if (configuration.usesManualFallback()) {
      return TuitionGradeBankFallbackReason.COLLECTION_MODE_MANUAL_FALLBACK
    }
    if (!receivingBankAccount) return TuitionGradeBankFallbackReason.GRADE_BANK_NOT_CONFIGURED
    if (!receivingBankAccount.isActive()) return TuitionGradeBankFallbackReason.GRADE_BANK_INACTIVE
    if (receivingBankAccount.sepayStatus === SepayBankAccountStatus.UNKNOWN) {
      return TuitionGradeBankFallbackReason.SEPAY_BANK_STATUS_UNKNOWN
    }
    if (receivingBankAccount.sepayStatus === SepayBankAccountStatus.INACTIVE) {
      return TuitionGradeBankFallbackReason.SEPAY_BANK_INACTIVE
    }

    return null
  }
}

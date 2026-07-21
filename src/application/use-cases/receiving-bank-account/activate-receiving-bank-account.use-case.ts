import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto, ReceivingBankAccountResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus, ReceivingBankAccountStatus } from '../../../shared/enums'
import { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'

@Injectable()
export class ActivateReceivingBankAccountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    receivingBankAccountId: number,
    adminId: number,
    canViewSensitiveAccountNumber: boolean,
  ): Promise<BaseResponseDto<ReceivingBankAccountResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.receivingBankAccountRepository.findById(receivingBankAccountId)
      if (!current) {
        throw new NotFoundException(`Không tìm thấy tài khoản nhận tiền với ID ${receivingBankAccountId}`)
      }

      if (current.status === ReceivingBankAccountStatus.ACTIVE) {
        return ReceivingBankAccountResponseDto.fromReceivingBankAccount(
          current,
          canViewSensitiveAccountNumber,
        )
      }

      const updated = await repos.receivingBankAccountRepository.update(receivingBankAccountId, {
        status: ReceivingBankAccountStatus.ACTIVE,
      })
      const result = ReceivingBankAccountResponseDto.fromReceivingBankAccount(
        updated,
        canViewSensitiveAccountNumber,
      )

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.RECEIVING_BANK_ACCOUNT.ACTIVATE,
        resourceType: RESOURCE_TYPES.RECEIVING_BANK_ACCOUNT,
        resourceId: String(receivingBankAccountId),
        status: AuditStatus.SUCCESS,
        beforeData: this.toAuditData(current),
        afterData: this.toAuditData(updated),
      })

      return result
    })

    return BaseResponseDto.success('Kích hoạt tài khoản nhận tiền học phí thành công', response)
  }

  private toAuditData(account: ReceivingBankAccount) {
    return {
      receivingBankAccountId: account.receivingBankAccountId,
      bankCode: account.bankCode,
      accountNumberMasked: this.maskAccountNumber(account.accountNumber),
      status: account.status,
    }
  }

  private maskAccountNumber(accountNumber: string): string {
    return accountNumber.length <= 4
      ? '****'
      : `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
  }
}

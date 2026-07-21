import { Inject, Injectable } from '@nestjs/common'

import {
  BaseResponseDto,
  CreateReceivingBankAccountDto,
  ReceivingBankAccountResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus, ReceivingBankAccountStatus } from '../../../shared/enums'
import { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'

@Injectable()
export class CreateReceivingBankAccountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    dto: CreateReceivingBankAccountDto,
    adminId: number,
    canViewSensitiveAccountNumber: boolean,
  ): Promise<BaseResponseDto<ReceivingBankAccountResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const duplicate = await repos.receivingBankAccountRepository.findByBankAndAccountNumber(
        dto.bankCode,
        dto.accountNumber,
      )

      if (duplicate) {
        throw new ConflictException('Tài khoản ngân hàng này đã tồn tại')
      }

      const account = await repos.receivingBankAccountRepository.create({
        bankCode: dto.bankCode,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
        displayName: dto.displayName,
        status: ReceivingBankAccountStatus.ACTIVE,
        sepayBankAccountId: dto.sepayBankAccountId,
        notes: dto.notes,
      })
      const result = ReceivingBankAccountResponseDto.fromReceivingBankAccount(
        account,
        canViewSensitiveAccountNumber,
      )

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.RECEIVING_BANK_ACCOUNT.CREATE,
        resourceType: RESOURCE_TYPES.RECEIVING_BANK_ACCOUNT,
        resourceId: String(account.receivingBankAccountId),
        status: AuditStatus.SUCCESS,
        afterData: this.toAuditData(account),
      })

      return result
    })

    return BaseResponseDto.success('Tạo tài khoản nhận tiền học phí thành công', response)
  }

  private toAuditData(account: ReceivingBankAccount) {
    return {
      receivingBankAccountId: account.receivingBankAccountId,
      bankCode: account.bankCode,
      accountNumberMasked: this.maskAccountNumber(account.accountNumber),
      accountHolder: account.accountHolder,
      status: account.status,
    }
  }

  private maskAccountNumber(accountNumber: string): string {
    return accountNumber.length <= 4
      ? '****'
      : `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
  }
}

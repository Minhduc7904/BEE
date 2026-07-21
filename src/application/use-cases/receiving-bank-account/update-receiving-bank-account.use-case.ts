import { Inject, Injectable } from '@nestjs/common'

import {
  BaseResponseDto,
  ReceivingBankAccountResponseDto,
  UpdateReceivingBankAccountDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums'
import { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'

@Injectable()
export class UpdateReceivingBankAccountUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    receivingBankAccountId: number,
    dto: UpdateReceivingBankAccountDto,
    adminId: number,
    canViewSensitiveAccountNumber: boolean,
  ): Promise<BaseResponseDto<ReceivingBankAccountResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.receivingBankAccountRepository.findById(receivingBankAccountId)
      if (!current) {
        throw new NotFoundException(`Không tìm thấy tài khoản nhận tiền với ID ${receivingBankAccountId}`)
      }

      if (!this.hasChanges(dto)) {
        return ReceivingBankAccountResponseDto.fromReceivingBankAccount(
          current,
          canViewSensitiveAccountNumber,
        )
      }

      const nextBankCode = dto.bankCode ?? current.bankCode
      const nextAccountNumber = dto.accountNumber ?? current.accountNumber
      if (nextBankCode !== current.bankCode || nextAccountNumber !== current.accountNumber) {
        const duplicate = await repos.receivingBankAccountRepository.findByBankAndAccountNumber(
          nextBankCode,
          nextAccountNumber,
        )

        if (duplicate && duplicate.receivingBankAccountId !== receivingBankAccountId) {
          throw new ConflictException('Tài khoản ngân hàng này đã tồn tại')
        }
      }

      const beforeData = this.toAuditData(current)
      const updated = await repos.receivingBankAccountRepository.update(receivingBankAccountId, dto)
      const result = ReceivingBankAccountResponseDto.fromReceivingBankAccount(
        updated,
        canViewSensitiveAccountNumber,
      )

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.RECEIVING_BANK_ACCOUNT.UPDATE,
        resourceType: RESOURCE_TYPES.RECEIVING_BANK_ACCOUNT,
        resourceId: String(receivingBankAccountId),
        status: AuditStatus.SUCCESS,
        beforeData,
        afterData: this.toAuditData(updated),
      })

      return result
    })

    return BaseResponseDto.success('Cập nhật tài khoản nhận tiền học phí thành công', response)
  }

  private hasChanges(dto: UpdateReceivingBankAccountDto): boolean {
    return (
      dto.bankCode !== undefined ||
      dto.accountNumber !== undefined ||
      dto.accountHolder !== undefined ||
      dto.displayName !== undefined ||
      dto.sepayBankAccountId !== undefined ||
      dto.notes !== undefined
    )
  }

  private toAuditData(account: ReceivingBankAccount) {
    return {
      receivingBankAccountId: account.receivingBankAccountId,
      bankCode: account.bankCode,
      accountNumberMasked: this.maskAccountNumber(account.accountNumber),
      accountHolder: account.accountHolder,
      displayName: account.displayName,
      status: account.status,
    }
  }

  private maskAccountNumber(accountNumber: string): string {
    return accountNumber.length <= 4
      ? '****'
      : `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
  }
}

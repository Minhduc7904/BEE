import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto, SyncReceivingBankAccountsFromSepayResponseDto } from '../../dtos'
import { SepayService as SepayServicePort } from '../../interfaces'
import type { SepayBankAccount } from '../../interfaces'
import type { ReceivingBankAccount } from '../../../domain/entities/tuition-online-payment'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import {
  AuditStatus,
  ReceivingBankAccountStatus,
  SepayBankAccountStatus,
} from '../../../shared/enums'

type SyncOutcome = 'created' | 'updated' | 'unchanged'

@Injectable()
export class SyncReceivingBankAccountsFromSepayUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject(SepayServicePort) private readonly sepayService: SepayServicePort,
  ) {}

  async execute(adminId: number): Promise<BaseResponseDto<SyncReceivingBankAccountsFromSepayResponseDto>> {
    const sepayBankAccounts = await this.sepayService.listBankAccounts()
    this.ensureNoDuplicateSepayAccounts(sepayBankAccounts)

    const outcomes = await this.unitOfWork.executeInTransaction(async (repos) => {
      const results: SyncOutcome[] = []

      for (const sepayBankAccount of sepayBankAccounts) {
        const matchingAccounts = await this.findMatchingAccounts(
          repos.receivingBankAccountRepository,
          sepayBankAccount,
        )

        if (matchingAccounts.length > 1) {
          throw new ConflictException(
            `Dữ liệu cục bộ bị trùng khi đối chiếu tài khoản SePay ${sepayBankAccount.sepayBankAccountId}`,
          )
        }

        const current = matchingAccounts[0]
        if (!current) {
          const created = await repos.receivingBankAccountRepository.create({
            bankCode: sepayBankAccount.bankCode,
            accountNumber: sepayBankAccount.accountNumber,
            accountHolder: sepayBankAccount.accountHolder,
            status: ReceivingBankAccountStatus.ACTIVE,
            sepayBankAccountId: sepayBankAccount.sepayBankAccountId,
            sepayStatus: this.toSepayStatus(sepayBankAccount.isActive),
          })
          await this.createAuditLog(repos.adminAuditLogRepository, adminId, created, 'created')
          results.push('created')
          continue
        }

        if (!this.hasProviderChanges(current, sepayBankAccount)) {
          results.push('unchanged')
          continue
        }

        const updated = await repos.receivingBankAccountRepository.update(
          current.receivingBankAccountId,
          {
            bankCode: sepayBankAccount.bankCode,
            accountNumber: sepayBankAccount.accountNumber,
            accountHolder: sepayBankAccount.accountHolder,
            sepayBankAccountId: sepayBankAccount.sepayBankAccountId,
            sepayStatus: this.toSepayStatus(sepayBankAccount.isActive),
          },
        )
        await this.createAuditLog(repos.adminAuditLogRepository, adminId, updated, 'updated', current)
        results.push('updated')
      }

      return results
    })

    const response = {
      total: outcomes.length,
      created: outcomes.filter((outcome) => outcome === 'created').length,
      updated: outcomes.filter((outcome) => outcome === 'updated').length,
      unchanged: outcomes.filter((outcome) => outcome === 'unchanged').length,
    }

    return BaseResponseDto.success('Đồng bộ tài khoản nhận tiền từ SePay thành công', response)
  }

  private async findMatchingAccounts(
    repository: UnitOfWorkRepos['receivingBankAccountRepository'],
    sepayBankAccount: SepayBankAccount,
  ): Promise<ReceivingBankAccount[]> {
    const [bySepayId, byBankAndAccountNumber] = await Promise.all([
      repository.findAllBySepayBankAccountId(sepayBankAccount.sepayBankAccountId),
      repository.findByBankAndAccountNumber(sepayBankAccount.bankCode, sepayBankAccount.accountNumber),
    ])
    const matches = new Map<number, ReceivingBankAccount>()
    for (const account of bySepayId) {
      matches.set(account.receivingBankAccountId, account)
    }
    if (byBankAndAccountNumber) {
      matches.set(byBankAndAccountNumber.receivingBankAccountId, byBankAndAccountNumber)
    }

    return [...matches.values()]
  }

  private ensureNoDuplicateSepayAccounts(sepayBankAccounts: SepayBankAccount[]): void {
    const seenIds = new Set<string>()
    const seenBankAccounts = new Set<string>()
    for (const account of sepayBankAccounts) {
      const bankAccountKey = `${account.bankCode}:${account.accountNumber}`
      if (seenIds.has(account.sepayBankAccountId) || seenBankAccounts.has(bankAccountKey)) {
        throw new ConflictException('SePay trả về tài khoản ngân hàng bị trùng')
      }
      seenIds.add(account.sepayBankAccountId)
      seenBankAccounts.add(bankAccountKey)
    }
  }

  private hasProviderChanges(current: ReceivingBankAccount, sepayBankAccount: SepayBankAccount): boolean {
    return (
      current.bankCode !== sepayBankAccount.bankCode ||
      current.accountNumber !== sepayBankAccount.accountNumber ||
      current.accountHolder !== sepayBankAccount.accountHolder ||
      current.sepayBankAccountId !== sepayBankAccount.sepayBankAccountId ||
      current.sepayStatus !== this.toSepayStatus(sepayBankAccount.isActive)
    )
  }

  private async createAuditLog(
    auditRepository: UnitOfWorkRepos['adminAuditLogRepository'],
    adminId: number,
    account: ReceivingBankAccount,
    outcome: 'created' | 'updated',
    before?: ReceivingBankAccount,
  ): Promise<void> {
    await auditRepository.create({
      adminId,
      actionKey: ACTION_KEYS.RECEIVING_BANK_ACCOUNT.SYNC_FROM_SEPAY,
      resourceType: RESOURCE_TYPES.RECEIVING_BANK_ACCOUNT,
      resourceId: String(account.receivingBankAccountId),
      status: AuditStatus.SUCCESS,
      ...(before && { beforeData: this.toAuditData(before) }),
      afterData: { ...this.toAuditData(account), syncOutcome: outcome },
    })
  }

  private toAuditData(account: ReceivingBankAccount) {
    return {
      receivingBankAccountId: account.receivingBankAccountId,
      bankCode: account.bankCode,
      accountNumberMasked: this.maskAccountNumber(account.accountNumber),
      accountHolder: account.accountHolder,
      sepayBankAccountId: account.sepayBankAccountId,
      sepayStatus: account.sepayStatus,
    }
  }

  private maskAccountNumber(accountNumber: string): string {
    return accountNumber.length <= 4
      ? '****'
      : `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
  }

  private toSepayStatus(isActive: boolean): SepayBankAccountStatus {
    return isActive ? SepayBankAccountStatus.ACTIVE : SepayBankAccountStatus.INACTIVE
  }
}

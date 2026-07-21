import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto, ReceivingBankAccountBalanceResponseDto } from '../../dtos'
import { SepayService as SepayServicePort } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetReceivingBankAccountBalanceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject(SepayServicePort) private readonly sepayService: SepayServicePort,
  ) {}

  async execute(
    receivingBankAccountId: number,
    canViewSensitiveAccountNumber: boolean,
  ): Promise<BaseResponseDto<ReceivingBankAccountBalanceResponseDto>> {
    const account = await this.unitOfWork.executeInTransaction((repos) =>
      repos.receivingBankAccountRepository.findById(receivingBankAccountId),
    )
    if (!account) {
      throw new NotFoundException(`Không tìm thấy tài khoản nhận tiền với ID ${receivingBankAccountId}`)
    }
    if (!account.sepayBankAccountId) {
      throw new ConflictException('Tài khoản chưa có ID SePay; hãy đồng bộ hoặc cấu hình ID SePay trước')
    }

    const sepayBankAccount = await this.sepayService.getBankAccount(account.sepayBankAccountId)
    const response = ReceivingBankAccountBalanceResponseDto.fromSepayBankAccount(
      {
        receivingBankAccountId: account.receivingBankAccountId,
        sepayBankAccountId: sepayBankAccount.sepayBankAccountId,
        bankCode: sepayBankAccount.bankCode,
        accountNumber: sepayBankAccount.accountNumber,
        balance: sepayBankAccount.balance,
        isSepayAccountActive: sepayBankAccount.isActive,
        lastTransactionAt: sepayBankAccount.lastTransactionAt,
      },
      canViewSensitiveAccountNumber,
    )

    return BaseResponseDto.success('Lấy số dư tài khoản từ SePay thành công', response)
  }
}

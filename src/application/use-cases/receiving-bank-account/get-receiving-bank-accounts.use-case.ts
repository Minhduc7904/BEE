import { Inject, Injectable } from '@nestjs/common'

import {
  PaginationResponseDto,
  ReceivingBankAccountListQueryDto,
  ReceivingBankAccountResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetReceivingBankAccountsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    query: ReceivingBankAccountListQueryDto,
    canViewSensitiveAccountNumber: boolean,
  ): Promise<PaginationResponseDto<ReceivingBankAccountResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const options = query.toReceivingBankAccountListOptions()
      const [accounts, total] = await Promise.all([
        repos.receivingBankAccountRepository.findAll(options),
        repos.receivingBankAccountRepository.count(options),
      ])

      return {
        data: ReceivingBankAccountResponseDto.fromReceivingBankAccountList(
          accounts,
          canViewSensitiveAccountNumber,
        ),
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách tài khoản nhận tiền học phí thành công',
      result.data,
      result.page,
      result.limit,
      result.total,
    )
  }
}

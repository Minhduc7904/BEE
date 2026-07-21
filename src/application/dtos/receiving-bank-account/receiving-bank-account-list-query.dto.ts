import { ReceivingBankAccountListOptions } from '../../../domain/interface/tuition-online-payment'
import { ReceivingBankAccountStatus } from '../../../shared/enums'
import { IsOptionalEnumValue, IsOptionalString } from '../../../shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'

export class ReceivingBankAccountListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(ReceivingBankAccountStatus, 'Trạng thái')
  status?: ReceivingBankAccountStatus

  @IsOptionalString('Mã ngân hàng', 30)
  bankCode?: string

  toReceivingBankAccountListOptions(): ReceivingBankAccountListOptions {
    const allowedSortFields = [
      'receivingBankAccountId',
      'bankCode',
      'accountHolder',
      'displayName',
      'status',
      'createdAt',
      'updatedAt',
    ] as const
    const sortBy: NonNullable<ReceivingBankAccountListOptions['sortBy']> = allowedSortFields.includes(
      this.sortBy as (typeof allowedSortFields)[number],
    )
      ? (this.sortBy as NonNullable<ReceivingBankAccountListOptions['sortBy']>)
      : 'createdAt'

    return {
      skip: this.offset,
      take: this.limit ?? 10,
      search: this.search,
      status: this.status,
      bankCode: this.bankCode,
      sortBy,
      sortOrder: this.sortOrder === 'asc' ? 'asc' : 'desc',
    }
  }
}

import { Injectable } from '@nestjs/common'
import { BaseResponseDto, SyncSepayTransactionsResponseDto } from '../../dtos'
import { SepayTransactionSyncService } from '../sepay/sepay-transaction-sync.service'

@Injectable()
export class SyncSepayTransactionsUseCase {
  constructor(private readonly sepayTransactionSyncService: SepayTransactionSyncService) {}

  async execute(adminId: number): Promise<BaseResponseDto<SyncSepayTransactionsResponseDto>> {
    const response = await this.sepayTransactionSyncService.execute({
      workerId: `ADMIN_API:${adminId}`,
      adminId,
    })
    if (!response.data) {
      throw new Error('Đồng bộ SePay không trả về kết quả')
    }
    return BaseResponseDto.success(
      response.message,
      SyncSepayTransactionsResponseDto.fromResult(response.data),
    )
  }
}

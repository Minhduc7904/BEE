import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SepayTransactionSyncService } from 'src/application/use-cases/sepay/sepay-transaction-sync.service'

const SEPAY_TRANSACTION_SYNC_ALREADY_RUNNING = 'SEPAY_TRANSACTION_SYNC_ALREADY_RUNNING'

@Injectable()
export class BankTransferTransactionScheduler {
  private readonly logger = new Logger(BankTransferTransactionScheduler.name)

  constructor(private readonly sepayTransactionSyncService: SepayTransactionSyncService) {}

  @Cron('0 */5 * * * *', {
    name: 'sepay-transaction-sync',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async syncSepayTransactions(): Promise<void> {
    try {
      const didRun = await this.sepayTransactionSyncService.executeScheduled({
        workerId: 'SCHEDULER:SEPAY_TRANSACTION_SYNC',
      })
      if (!didRun) this.logger.debug('Bỏ qua đồng bộ SePay vì job đang tắt')
    } catch (error) {
      if (this.isSyncAlreadyRunningError(error)) {
        this.logger.debug('Bỏ qua đồng bộ SePay vì worker khác đang chạy')
        return
      }

      this.logger.error('Đồng bộ giao dịch ngân hàng SePay theo lịch thất bại')
    }
  }

  private isSyncAlreadyRunningError(error: unknown): boolean {
    if (!(error instanceof ConflictException)) return false

    const response = error.getResponse()
    return (response as { code?: unknown }).code === SEPAY_TRANSACTION_SYNC_ALREADY_RUNNING
  }
}

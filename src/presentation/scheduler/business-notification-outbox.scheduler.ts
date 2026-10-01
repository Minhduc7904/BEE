import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { RelayBusinessNotificationOutboxUseCase } from '../../application/use-cases/notification'

@Injectable()
export class BusinessNotificationOutboxScheduler {
  private readonly logger = new Logger(BusinessNotificationOutboxScheduler.name)

  constructor(private readonly relay: RelayBusinessNotificationOutboxUseCase) {}

  @Cron('*/10 * * * * *', {
    name: 'business-notification-outbox-relay',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async relayOutbox(): Promise<void> {
    try {
      const result = await this.relay.executeScheduled('SCHEDULER:BUSINESS_NOTIFICATION_OUTBOX_RELAY')
      if (!result) return
      this.logger.log(
        `Outbox job #${result.backgroundJobRunId}: claimed=${result.claimed}, published=${result.published}, retried=${result.retried}, dead=${result.dead}`,
      )
    } catch (error) {
      if (error instanceof ConflictException && error.message === 'BUSINESS_NOTIFICATION_OUTBOX_RELAY_ALREADY_RUNNING')
        return
      this.logger.error('Chuyển tiếp outbox notification thất bại', error instanceof Error ? error.stack : undefined)
    }
  }
}

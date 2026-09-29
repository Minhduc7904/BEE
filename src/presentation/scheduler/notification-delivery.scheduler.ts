import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { DispatchNotificationDeliveriesUseCase } from '../../application/use-cases/notification'

@Injectable()
export class NotificationDeliveryScheduler {
  private readonly logger = new Logger(NotificationDeliveryScheduler.name)

  constructor(private readonly dispatcher: DispatchNotificationDeliveriesUseCase) {}

  @Cron('0 * * * * *', {
    name: 'notification-delivery-dispatcher',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async dispatch(): Promise<void> {
    try {
      const result = await this.dispatcher.executeScheduled('SCHEDULER:NOTIFICATION_DELIVERY_DISPATCHER')
      if (!result) return
      this.logger.log(
        `Notification job #${result.backgroundJobRunId}: claimed=${result.claimed}, sent=${result.sent}, skipped=${result.skipped}, retried=${result.retried}, dead=${result.dead}`,
      )
    } catch (error) {
      if (error instanceof ConflictException && error.message === 'NOTIFICATION_DELIVERY_DISPATCHER_ALREADY_RUNNING') {
        this.logger.debug('Bỏ qua điều phối notification vì worker khác đang chạy')
        return
      }
      this.logger.error('Điều phối notification nền thất bại', error instanceof Error ? error.stack : undefined)
    }
  }
}

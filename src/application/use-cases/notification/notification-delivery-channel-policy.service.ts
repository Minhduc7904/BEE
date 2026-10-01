import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import notificationDeliveryConfig from '../../../config/notification-delivery.config'
import { NotificationDeliveryChannel } from '../../../shared/enums'

@Injectable()
export class NotificationDeliveryChannelPolicyService {
  constructor(
    @Inject(notificationDeliveryConfig.KEY)
    private readonly config: ConfigType<typeof notificationDeliveryConfig>,
  ) {}

  enabledInAppChannels(): NotificationDeliveryChannel[] {
    return this.config.pushEnabled
      ? [NotificationDeliveryChannel.IN_APP, NotificationDeliveryChannel.PUSH]
      : [NotificationDeliveryChannel.IN_APP]
  }

  isEnabled(channel: NotificationDeliveryChannel): boolean {
    return channel !== NotificationDeliveryChannel.PUSH || this.config.pushEnabled
  }

  assertExplicitChannelsEnabled(channels: NotificationDeliveryChannel[]): void {
    if (channels.some((channel) => !this.isEnabled(channel))) {
      throw new BadRequestException({
        code: 'CHANNEL_DISABLED',
        message: 'Kênh PUSH hiện đang tắt',
      })
    }
  }
}

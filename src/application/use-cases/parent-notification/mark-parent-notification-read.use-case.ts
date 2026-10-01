import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { NotificationRealtimeService, ParentNotificationInboxRepository } from '../../interfaces'
import { BaseResponseDto, ParentNotificationInboxItemDto } from '../../dtos'
import { NotificationChangeReason } from '../../../shared/enums'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { requireParentInboxAccess } from './parent-notification-inbox-access'

@Injectable()
export class MarkParentNotificationReadUseCase {
  constructor(
    private readonly inbox: ParentNotificationInboxRepository,
    private readonly realtime: NotificationRealtimeService,
  ) {}

  async execute(
    identity: AuthenticatedUser,
    notificationId: number,
  ): Promise<BaseResponseDto<ParentNotificationInboxItemDto>> {
    const { userId } = await requireParentInboxAccess(identity, this.inbox)
    const result = await this.inbox.markRead(userId, notificationId)
    if (!result.notification) throw new NotFoundException('Không tìm thấy thông báo')

    if (result.changed) {
      this.realtime.notifyChanged(userId, { reason: NotificationChangeReason.READ, notificationId })
    }
    return BaseResponseDto.success(
      'Đánh dấu thông báo đã đọc thành công',
      ParentNotificationInboxItemDto.fromItem(result.notification),
    )
  }
}

import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentNotificationInboxRepository } from '../../interfaces'
import { BaseResponseDto, ParentNotificationInboxItemDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { requireParentInboxAccess } from './parent-notification-inbox-access'

@Injectable()
export class GetParentNotificationUseCase {
  constructor(private readonly inbox: ParentNotificationInboxRepository) {}

  async execute(
    identity: AuthenticatedUser,
    notificationId: number,
  ): Promise<BaseResponseDto<ParentNotificationInboxItemDto>> {
    const { userId } = await requireParentInboxAccess(identity, this.inbox)
    const notification = await this.inbox.findOwnedById(userId, notificationId)
    if (!notification) throw new NotFoundException('Không tìm thấy thông báo')
    return BaseResponseDto.success(
      'Lấy chi tiết thông báo thành công',
      ParentNotificationInboxItemDto.fromItem(notification),
    )
  }
}

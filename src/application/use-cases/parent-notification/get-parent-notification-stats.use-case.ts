import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentNotificationInboxRepository } from '../../interfaces'
import { BaseResponseDto, ParentNotificationStatsResponseDto } from '../../dtos'
import { requireParentInboxAccess } from './parent-notification-inbox-access'

@Injectable()
export class GetParentNotificationStatsUseCase {
  constructor(private readonly inbox: ParentNotificationInboxRepository) {}

  async execute(identity: AuthenticatedUser): Promise<BaseResponseDto<ParentNotificationStatsResponseDto>> {
    const { userId } = await requireParentInboxAccess(identity, this.inbox)
    const stats = await this.inbox.getStats(userId)
    return BaseResponseDto.success(
      'Lấy thống kê thông báo thành công',
      ParentNotificationStatsResponseDto.fromStats(stats),
    )
  }
}

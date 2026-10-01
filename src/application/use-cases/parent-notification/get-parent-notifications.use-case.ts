import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentNotificationInboxRepository } from '../../interfaces'
import { CursorPageResponseDto } from '../../dtos/pagination/cursor-page-response.dto'
import { ParentNotificationInboxItemDto, ParentNotificationInboxQueryDto } from '../../dtos'
import { requireParentInboxAccess } from './parent-notification-inbox-access'

@Injectable()
export class GetParentNotificationsUseCase {
  constructor(private readonly inbox: ParentNotificationInboxRepository) {}

  async execute(
    identity: AuthenticatedUser,
    query: ParentNotificationInboxQueryDto,
  ): Promise<CursorPageResponseDto<ParentNotificationInboxItemDto>> {
    const { userId } = await requireParentInboxAccess(identity, this.inbox, query.studentId)
    const pagination = query.toPagination()
    const result = await this.inbox.list({
      userId,
      studentId: query.studentId,
      type: query.type,
      isRead: query.isRead,
      ...pagination,
    })
    return CursorPageResponseDto.success(
      'Lấy danh sách thông báo thành công',
      result.data.map((item) => ParentNotificationInboxItemDto.fromItem(item)),
      result.hasNext,
      result.nextCursor,
      pagination.limit,
    )
  }
}

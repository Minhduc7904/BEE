import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotificationDispatchRecipientListQueryDto } from '../../dtos/notification/notification-dispatch-recipient-list-query.dto'

@Injectable()
export class GetNotificationDispatchRecipientsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}
  async execute(jobId: number, query: NotificationDispatchRecipientListQueryDto) {
    const page = query.page ?? 1,
      limit = Math.min(query.limit ?? 20, 100)
    const result = await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDispatchRecipientRepository.findAllByJob(jobId, {
        page,
        limit,
        recipientType: query.recipientType,
        channel: query.channel,
        deliveryStatus: query.deliveryStatus,
        search: query.search?.trim(),
      }),
    )
    return BaseResponseDto.success('Lấy trạng thái người nhận thành công', {
      items: result.items,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    })
  }
}

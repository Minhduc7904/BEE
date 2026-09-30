import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotificationDispatchJobListQueryDto } from '../../dtos/notification/notification-dispatch-job-list-query.dto'

@Injectable()
export class GetNotificationDispatchJobsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}
  async execute(query: NotificationDispatchJobListQueryDto) {
    const page = query.page ?? 1,
      limit = Math.min(query.limit ?? 20, 100)
    const result = await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDispatchJobRepository.findAll({
        page,
        limit,
        status: query.status,
        type: query.type,
        creatorId: query.creatorId,
        search: query.search?.trim(),
        from: query.fromDate ? new Date(query.fromDate) : undefined,
        to: query.toDate ? this.endOfDay(query.toDate) : undefined,
      }),
    )
    return BaseResponseDto.success('Lấy lịch sử notification thành công', {
      items: result.items,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    })
  }

  private endOfDay(value: string): Date {
    const date = new Date(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) date.setHours(23, 59, 59, 999)
    return date
  }
}

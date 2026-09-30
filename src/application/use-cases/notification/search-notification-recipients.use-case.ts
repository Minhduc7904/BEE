import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotificationRecipientSearchQueryDto } from '../../dtos/notification/notification-recipient-search-query.dto'

@Injectable()
export class SearchNotificationRecipientsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: NotificationRecipientSearchQueryDto) {
    const search = query.search.trim()
    if (search.length < 2) throw new BadRequestException('Từ khóa tìm kiếm phải có ít nhất 2 ký tự')
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const result = await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDispatchRecipientRepository.search({
        recipientType: query.recipientType,
        search,
        page,
        limit,
        grade: query.grade,
      }),
    )
    return BaseResponseDto.success('Tìm người nhận thành công', {
      items: result.items,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    })
  }
}

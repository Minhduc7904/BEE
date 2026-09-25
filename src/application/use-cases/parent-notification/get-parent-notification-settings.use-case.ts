import { Inject, Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto, ParentNotificationSettingsResponseDto } from '../../dtos'
import { loadParentNotificationSettings, requireParentIdentity } from './parent-notification-access'

@Injectable()
export class GetParentNotificationSettingsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(identity: AuthenticatedUser): Promise<BaseResponseDto<ParentNotificationSettingsResponseDto>> {
    const { userId, parentId } = requireParentIdentity(identity)

    const settings = await this.unitOfWork.executeInTransaction((repos) =>
      loadParentNotificationSettings(repos, userId, parentId),
    )

    return BaseResponseDto.success('Lấy cài đặt thông báo thành công', settings)
  }
}

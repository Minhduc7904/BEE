import { Inject, Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto, ParentNotificationSettingsResponseDto, UpdateUserNotificationEnabledDto } from '../../dtos'
import { loadParentNotificationSettings, requireParentIdentity } from './parent-notification-access'

@Injectable()
export class UpdateUserNotificationEnabledUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    identity: AuthenticatedUser,
    dto: UpdateUserNotificationEnabledDto,
  ): Promise<BaseResponseDto<ParentNotificationSettingsResponseDto>> {
    const { userId, parentId } = requireParentIdentity(identity)

    const settings = await this.unitOfWork.executeInTransaction(async (repos) => {
      await repos.userNotificationSettingRepository.upsertEnabled(userId, dto.isEnabled)

      return loadParentNotificationSettings(repos, userId, parentId)
    })

    return BaseResponseDto.success('Cập nhật thông báo tổng thành công', settings)
  }
}

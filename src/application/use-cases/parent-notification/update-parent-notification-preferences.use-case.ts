import { Inject, Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import {
  BaseResponseDto,
  ParentNotificationSettingsResponseDto,
  UpdateParentNotificationPreferencesDto,
} from '../../dtos'
import { ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { loadParentNotificationSettings, requireParentIdentity } from './parent-notification-access'

@Injectable()
export class UpdateParentNotificationPreferencesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    identity: AuthenticatedUser,
    dto: UpdateParentNotificationPreferencesDto,
  ): Promise<BaseResponseDto<ParentNotificationSettingsResponseDto>> {
    const { userId, parentId } = requireParentIdentity(identity)

    if (dto.attendanceEnabled === undefined && dto.resultEnabled === undefined && dto.tuitionEnabled === undefined) {
      throw new ValidationException('Cần ít nhất một loại thông báo để cập nhật')
    }

    const settings = await this.unitOfWork.executeInTransaction(async (repos) => {
      await repos.parentNotificationSettingRepository.upsertPreferences(parentId, {
        attendanceEnabled: dto.attendanceEnabled,
        resultEnabled: dto.resultEnabled,
        tuitionEnabled: dto.tuitionEnabled,
      })

      return loadParentNotificationSettings(repos, userId, parentId)
    })

    return BaseResponseDto.success('Cập nhật cài đặt thông báo thành công', settings)
  }
}

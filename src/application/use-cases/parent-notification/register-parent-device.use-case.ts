import { Inject, Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto, ParentDeviceResponseDto, RegisterParentDeviceDto } from '../../dtos'
import { requireParentIdentity } from './parent-notification-access'

@Injectable()
export class RegisterParentDeviceUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    identity: AuthenticatedUser,
    dto: RegisterParentDeviceDto,
  ): Promise<BaseResponseDto<ParentDeviceResponseDto>> {
    const { userId } = requireParentIdentity(identity)

    const device = await this.unitOfWork.executeInTransaction((repos) =>
      repos.userDeviceRepository.upsertOwned({
        userId,
        deviceId: dto.deviceId,
        fcmToken: dto.fcmToken,
        platform: dto.platform,
        appVersion: dto.appVersion,
      }),
    )

    return BaseResponseDto.success(
      'Đăng ký thiết bị nhận thông báo thành công',
      ParentDeviceResponseDto.fromDevice(device),
    )
  }
}

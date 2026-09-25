import { Inject, Injectable } from '@nestjs/common'
import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos'
import { requireParentIdentity } from './parent-notification-access'

@Injectable()
export class UnregisterParentDeviceUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(identity: AuthenticatedUser, deviceId: string): Promise<BaseResponseDto<{ removed: boolean }>> {
    const { userId } = requireParentIdentity(identity)

    const removedCount = await this.unitOfWork.executeInTransaction((repos) =>
      repos.userDeviceRepository.deleteByUserIdAndDeviceId(userId, deviceId),
    )

    return BaseResponseDto.success('Gỡ thiết bị nhận thông báo thành công', { removed: removedCount > 0 })
  }
}

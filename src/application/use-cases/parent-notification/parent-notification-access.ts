import type { AuthenticatedUser } from '../../interfaces'
import type { UnitOfWorkRepos } from '../../../domain/repositories'
import { ParentNotificationSettingsResponseDto } from '../../dtos'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'

/** Chỉ tài khoản phụ huynh mới được dùng các API thiết bị và cài đặt thông báo phụ huynh. */
export function requireParentIdentity(identity: AuthenticatedUser): { userId: number; parentId: number } {
  if (identity.userType !== 'parent' || !identity.parentId) {
    throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể dùng chức năng này')
  }

  return { userId: identity.userId, parentId: identity.parentId }
}

/** Đọc cài đặt thông báo hiện tại của phụ huynh; chưa có bản ghi thì trả về mặc định. */
export async function loadParentNotificationSettings(
  repos: UnitOfWorkRepos,
  userId: number,
  parentId: number,
): Promise<ParentNotificationSettingsResponseDto> {
  const [userSetting, parentSetting] = await Promise.all([
    repos.userNotificationSettingRepository.findByUserId(userId),
    repos.parentNotificationSettingRepository.findByParentId(parentId),
  ])

  return ParentNotificationSettingsResponseDto.from(userSetting, parentSetting)
}

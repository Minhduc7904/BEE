import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotificationType } from '../../../shared/enums'

export interface PushNotificationEligibility {
  allowed: boolean
  skipReason?: string
}

/**
 * Quyết định một PUSH delivery có được phép gửi tại thời điểm worker thực thi hay không.
 * Hiện chỉ parent được hỗ trợ; student/admin có thể được bổ sung thành policy riêng tại đây.
 */
@Injectable()
export class PushNotificationEligibilityService {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async evaluate(userId: number, type: NotificationType): Promise<PushNotificationEligibility> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const parent = await repos.parentRepository.findByUserId(userId)
      if (!parent) {
        return { allowed: false, skipReason: 'PUSH_RECIPIENT_TYPE_UNSUPPORTED' }
      }

      const [userSetting, parentSetting] = await Promise.all([
        repos.userNotificationSettingRepository.findByUserId(userId),
        repos.parentNotificationSettingRepository.findByParentId(parent.parentId),
      ])

      if (userSetting?.isEnabled !== true) {
        return { allowed: false, skipReason: 'PUSH_NOT_CONSENTED' }
      }

      if (type === NotificationType.ATTENDANCE && parentSetting?.attendanceEnabled === false) {
        return { allowed: false, skipReason: 'PARENT_ATTENDANCE_NOTIFICATION_DISABLED' }
      }

      if (type === NotificationType.TUITION && parentSetting?.tuitionEnabled === false) {
        return { allowed: false, skipReason: 'PARENT_TUITION_NOTIFICATION_DISABLED' }
      }

      if (type === NotificationType.RESULT && parentSetting?.resultEnabled === false) {
        return { allowed: false, skipReason: 'PARENT_RESULT_NOTIFICATION_DISABLED' }
      }

      return { allowed: true }
    })
  }
}

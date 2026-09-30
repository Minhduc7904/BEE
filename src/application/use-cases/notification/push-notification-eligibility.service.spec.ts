import type { IUnitOfWork } from '../../../domain/repositories'
import { NotificationType } from '../../../shared/enums'
import { PushNotificationEligibilityService } from './push-notification-eligibility.service'

describe('PushNotificationEligibilityService', () => {
  const findParentByUserId = jest.fn()
  const findUserSetting = jest.fn()
  const findParentSetting = jest.fn()
  const repos = {
    parentRepository: { findByUserId: findParentByUserId },
    userNotificationSettingRepository: { findByUserId: findUserSetting },
    parentNotificationSettingRepository: { findByParentId: findParentSetting },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((callback) => callback(repos)),
  } as unknown as IUnitOfWork
  const service = new PushNotificationEligibilityService(unitOfWork)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('chưa gửi PUSH cho student/admin khi chưa có policy hỗ trợ', async () => {
    findParentByUserId.mockResolvedValue(null)

    await expect(service.evaluate(10, NotificationType.SYSTEM)).resolves.toEqual({
      allowed: false,
      skipReason: 'PUSH_RECIPIENT_TYPE_UNSUPPORTED',
    })
    expect(findUserSetting).not.toHaveBeenCalled()
  })

  it('không gửi PUSH khi parent chưa đồng ý setting tổng', async () => {
    findParentByUserId.mockResolvedValue({ parentId: 20 })
    findUserSetting.mockResolvedValue({ isEnabled: null })
    findParentSetting.mockResolvedValue(null)

    await expect(service.evaluate(10, NotificationType.SYSTEM)).resolves.toEqual({
      allowed: false,
      skipReason: 'PUSH_NOT_CONSENTED',
    })
  })

  it.each([
    [NotificationType.ATTENDANCE, { attendanceEnabled: false }, 'PARENT_ATTENDANCE_NOTIFICATION_DISABLED'],
    [NotificationType.TUITION, { tuitionEnabled: false }, 'PARENT_TUITION_NOTIFICATION_DISABLED'],
    [NotificationType.RESULT, { resultEnabled: false }, 'PARENT_RESULT_NOTIFICATION_DISABLED'],
  ])('kiểm tra setting riêng của parent cho loại %s', async (type, parentSetting, skipReason) => {
    findParentByUserId.mockResolvedValue({ parentId: 20 })
    findUserSetting.mockResolvedValue({ isEnabled: true })
    findParentSetting.mockResolvedValue(parentSetting)

    await expect(service.evaluate(10, type)).resolves.toEqual({ allowed: false, skipReason })
  })

  it('cho phép PUSH khi parent đồng ý và loại notification đang bật', async () => {
    findParentByUserId.mockResolvedValue({ parentId: 20 })
    findUserSetting.mockResolvedValue({ isEnabled: true })
    findParentSetting.mockResolvedValue({
      attendanceEnabled: true,
      resultEnabled: true,
      tuitionEnabled: true,
    })

    await expect(service.evaluate(10, NotificationType.ATTENDANCE)).resolves.toEqual({ allowed: true })
  })
})

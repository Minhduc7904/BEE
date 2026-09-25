import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { UserDevice } from '../../../domain/entities/notification/user-device.entity'
import { DevicePlatform } from '../../../shared/enums'
import { GetParentNotificationSettingsUseCase } from './get-parent-notification-settings.use-case'
import { RegisterParentDeviceUseCase } from './register-parent-device.use-case'
import { UnregisterParentDeviceUseCase } from './unregister-parent-device.use-case'
import { UpdateParentNotificationPreferencesUseCase } from './update-parent-notification-preferences.use-case'
import { UpdateUserNotificationEnabledUseCase } from './update-user-notification-enabled.use-case'

function createUnitOfWork(repos: Partial<UnitOfWorkRepos>): IUnitOfWork {
  return {
    executeInTransaction: async <T>(work: (value: UnitOfWorkRepos) => Promise<T>) => work(repos as UnitOfWorkRepos),
  }
}

const parentIdentity: AuthenticatedUser = {
  userId: 20,
  username: '0392923661',
  userType: 'parent',
  parentId: 7,
  roles: [],
  permissions: [],
}

const studentIdentity: AuthenticatedUser = { ...parentIdentity, userType: 'student', parentId: undefined }

const now = new Date('2026-09-25T00:00:00Z')

describe('Parent notification use cases', () => {
  it('đăng ký thiết bị bằng userId lấy từ token, không nhận từ body', async () => {
    const upsertOwned = jest.fn().mockResolvedValue(
      new UserDevice({
        id: 1,
        userId: 20,
        deviceId: 'device-a',
        fcmToken: 'token-a',
        platform: DevicePlatform.ANDROID,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      }),
    )
    const useCase = new RegisterParentDeviceUseCase(
      createUnitOfWork({
        userDeviceRepository: { upsertOwned } as unknown as UnitOfWorkRepos['userDeviceRepository'],
      }),
    )

    const result = await useCase.execute(parentIdentity, {
      deviceId: 'device-a',
      fcmToken: 'token-a',
      platform: DevicePlatform.ANDROID,
      appVersion: '1.0.0',
    })

    expect(upsertOwned).toHaveBeenCalledWith({
      userId: 20,
      deviceId: 'device-a',
      fcmToken: 'token-a',
      platform: DevicePlatform.ANDROID,
      appVersion: '1.0.0',
    })
    expect(result.data).toEqual({ deviceId: 'device-a', platform: DevicePlatform.ANDROID, lastSeenAt: now })
  })

  it('từ chối tài khoản không phải phụ huynh trước khi chạm DB', async () => {
    const upsertOwned = jest.fn()
    const useCase = new RegisterParentDeviceUseCase(
      createUnitOfWork({
        userDeviceRepository: { upsertOwned } as unknown as UnitOfWorkRepos['userDeviceRepository'],
      }),
    )

    await expect(
      useCase.execute(studentIdentity, { deviceId: 'd', fcmToken: 't', platform: DevicePlatform.IOS }),
    ).rejects.toMatchObject({ status: 403 })
    expect(upsertOwned).not.toHaveBeenCalled()
  })

  it('gỡ thiết bị theo deviceId của chính tài khoản', async () => {
    const deleteByUserIdAndDeviceId = jest.fn().mockResolvedValue(1)
    const useCase = new UnregisterParentDeviceUseCase(
      createUnitOfWork({
        userDeviceRepository: { deleteByUserIdAndDeviceId } as unknown as UnitOfWorkRepos['userDeviceRepository'],
      }),
    )

    const result = await useCase.execute(parentIdentity, 'device-a')

    expect(deleteByUserIdAndDeviceId).toHaveBeenCalledWith(20, 'device-a')
    expect(result.data).toEqual({ removed: true })
  })

  it('bật thông báo tổng rồi trả cài đặt đầy đủ', async () => {
    const upsertEnabled = jest.fn().mockResolvedValue(undefined)
    const useCase = new UpdateUserNotificationEnabledUseCase(
      createUnitOfWork({
        userNotificationSettingRepository: {
          upsertEnabled,
          findByUserId: jest.fn().mockResolvedValue({ isEnabled: true }),
        } as unknown as UnitOfWorkRepos['userNotificationSettingRepository'],
        parentNotificationSettingRepository: {
          findByParentId: jest.fn().mockResolvedValue(null),
        } as unknown as UnitOfWorkRepos['parentNotificationSettingRepository'],
      }),
    )

    const result = await useCase.execute(parentIdentity, { isEnabled: true })

    expect(upsertEnabled).toHaveBeenCalledWith(20, true)
    expect(result.data).toEqual({
      isEnabled: true,
      attendanceEnabled: true,
      resultEnabled: true,
      tuitionEnabled: true,
    })
  })

  it('cập nhật từng phần cờ loại thông báo theo parentId của token', async () => {
    const upsertPreferences = jest.fn().mockResolvedValue(undefined)
    const useCase = new UpdateParentNotificationPreferencesUseCase(
      createUnitOfWork({
        userNotificationSettingRepository: {
          findByUserId: jest.fn().mockResolvedValue({ isEnabled: true }),
        } as unknown as UnitOfWorkRepos['userNotificationSettingRepository'],
        parentNotificationSettingRepository: {
          upsertPreferences,
          findByParentId: jest
            .fn()
            .mockResolvedValue({ attendanceEnabled: true, resultEnabled: false, tuitionEnabled: true }),
        } as unknown as UnitOfWorkRepos['parentNotificationSettingRepository'],
      }),
    )

    const result = await useCase.execute(parentIdentity, { resultEnabled: false })

    expect(upsertPreferences).toHaveBeenCalledWith(7, {
      attendanceEnabled: undefined,
      resultEnabled: false,
      tuitionEnabled: undefined,
    })
    expect(result.data?.resultEnabled).toBe(false)
  })

  it('từ chối cập nhật loại thông báo khi không có trường nào', async () => {
    const upsertPreferences = jest.fn()
    const useCase = new UpdateParentNotificationPreferencesUseCase(
      createUnitOfWork({
        parentNotificationSettingRepository: {
          upsertPreferences,
        } as unknown as UnitOfWorkRepos['parentNotificationSettingRepository'],
      }),
    )

    await expect(useCase.execute(parentIdentity, {})).rejects.toMatchObject({ status: 400 })
    expect(upsertPreferences).not.toHaveBeenCalled()
  })

  it('lấy cài đặt mặc định khi chưa có bản ghi', async () => {
    const useCase = new GetParentNotificationSettingsUseCase(
      createUnitOfWork({
        userNotificationSettingRepository: {
          findByUserId: jest.fn().mockResolvedValue(null),
        } as unknown as UnitOfWorkRepos['userNotificationSettingRepository'],
        parentNotificationSettingRepository: {
          findByParentId: jest.fn().mockResolvedValue(null),
        } as unknown as UnitOfWorkRepos['parentNotificationSettingRepository'],
      }),
    )

    const result = await useCase.execute(parentIdentity)

    expect(result.data).toEqual({
      isEnabled: null,
      attendanceEnabled: true,
      resultEnabled: true,
      tuitionEnabled: true,
    })
  })
})

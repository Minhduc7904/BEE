import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { LogoutUseCase } from './logout.use-case'

function createUnitOfWork(repos: Partial<UnitOfWorkRepos>): IUnitOfWork {
  return {
    executeInTransaction: async <T>(work: (value: UnitOfWorkRepos) => Promise<T>) => work(repos as UnitOfWorkRepos),
  }
}

function createUseCase(options: { tokenMatches: boolean }) {
  const deleteByUserId = jest.fn().mockResolvedValue(1)
  const deleteByUserIdAndDeviceId = jest.fn().mockResolvedValue(1)
  const useCase = new LogoutUseCase(
    createUnitOfWork({
      userRefreshTokenRepository: {
        findByUserId: jest.fn().mockResolvedValue([{ tokenHash: 'hash', userId: 20, isActive: () => true }]),
        revokeToken: jest.fn().mockResolvedValue(true),
        updateLastUsed: jest.fn().mockResolvedValue(undefined),
      } as unknown as UnitOfWorkRepos['userRefreshTokenRepository'],
      userRepository: {
        findById: jest.fn().mockResolvedValue({ userId: 20 }),
      } as unknown as UnitOfWorkRepos['userRepository'],
      userDeviceRepository: {
        deleteByUserId,
        deleteByUserIdAndDeviceId,
      } as unknown as UnitOfWorkRepos['userDeviceRepository'],
    }),
    { verifyRefreshToken: jest.fn().mockReturnValue({ sub: 20 }) } as never,
    { verifyToken: jest.fn().mockResolvedValue(options.tokenMatches) } as never,
  )

  return { useCase, deleteByUserId, deleteByUserIdAndDeviceId }
}

describe('LogoutUseCase - thiết bị nhận thông báo', () => {
  it('gỡ đúng thiết bị khi client gửi deviceId', async () => {
    const { useCase, deleteByUserId, deleteByUserIdAndDeviceId } = createUseCase({ tokenMatches: true })

    await useCase.execute({ refreshToken: 'refresh', deviceId: 'device-a' })

    expect(deleteByUserIdAndDeviceId).toHaveBeenCalledWith(20, 'device-a')
    expect(deleteByUserId).not.toHaveBeenCalled()
  })

  it('gỡ mọi thiết bị của tài khoản khi client không gửi deviceId', async () => {
    const { useCase, deleteByUserId, deleteByUserIdAndDeviceId } = createUseCase({ tokenMatches: true })

    await useCase.execute({ refreshToken: 'refresh' })

    expect(deleteByUserId).toHaveBeenCalledWith(20)
    expect(deleteByUserIdAndDeviceId).not.toHaveBeenCalled()
  })

  it('không gỡ thiết bị nào khi refresh token đã bị thu hồi (máy cũ bị đá)', async () => {
    const { useCase, deleteByUserId, deleteByUserIdAndDeviceId } = createUseCase({ tokenMatches: false })

    await expect(useCase.execute({ refreshToken: 'stale', deviceId: 'device-old' })).rejects.toMatchObject({
      status: 401,
    })
    expect(deleteByUserId).not.toHaveBeenCalled()
    expect(deleteByUserIdAndDeviceId).not.toHaveBeenCalled()
  })
})

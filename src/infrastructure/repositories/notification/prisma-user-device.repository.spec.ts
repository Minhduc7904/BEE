import { Prisma } from '@prisma/client'
import { PrismaUserDeviceRepository } from './prisma-user-device.repository'

const buildRecord = () => ({
  id: 1,
  userId: 42,
  deviceId: 'device-1',
  fcmToken: 'token-1',
  platform: 'ANDROID',
  appVersion: '1.0.0',
  lastSeenAt: new Date('2026-01-01T00:00:00Z'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
})

const buildP2002 = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  })

const input = {
  userId: 42,
  deviceId: 'device-1',
  fcmToken: 'token-1',
  platform: 'ANDROID',
  appVersion: '1.0.0',
} as never

const buildPrisma = (overrides: Record<string, jest.Mock> = {}) => {
  const userDevice = {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    upsert: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn().mockResolvedValue(buildRecord()),
    ...overrides,
  }
  return { userDevice }
}

describe('PrismaUserDeviceRepository.upsertOwned', () => {
  it('lần đầu thành công thì chỉ dùng upsert', async () => {
    const prisma = buildPrisma()
    prisma.userDevice.upsert.mockResolvedValue(buildRecord())
    const repository = new PrismaUserDeviceRepository(prisma as never)

    await repository.upsertOwned(input)

    expect(prisma.userDevice.upsert).toHaveBeenCalledTimes(1)
    expect(prisma.userDevice.updateMany).not.toHaveBeenCalled()
  })

  it('P2002: thử lại bằng deleteMany + updateMany (current read), không upsert lại', async () => {
    const prisma = buildPrisma()
    prisma.userDevice.upsert.mockRejectedValue(buildP2002())
    prisma.userDevice.updateMany.mockResolvedValue({ count: 1 })
    const repository = new PrismaUserDeviceRepository(prisma as never)

    const device = await repository.upsertOwned(input)

    expect(prisma.userDevice.upsert).toHaveBeenCalledTimes(1)
    expect(prisma.userDevice.deleteMany).toHaveBeenCalledTimes(2)
    expect(prisma.userDevice.updateMany).toHaveBeenCalledWith({
      where: { userId: 42, deviceId: 'device-1' },
      data: expect.objectContaining({ fcmToken: 'token-1', platform: 'ANDROID' }),
    })
    expect(prisma.userDevice.create).not.toHaveBeenCalled()
    expect(device.fcmToken).toBe('token-1')
  })

  it('P2002 do tranh FCM token: xóa chủ khác rồi create khi chưa có dòng của thiết bị', async () => {
    const prisma = buildPrisma()
    prisma.userDevice.upsert.mockRejectedValue(buildP2002())
    prisma.userDevice.updateMany.mockResolvedValue({ count: 0 })
    prisma.userDevice.create.mockResolvedValue(buildRecord())
    const repository = new PrismaUserDeviceRepository(prisma as never)

    await repository.upsertOwned(input)

    expect(prisma.userDevice.create).toHaveBeenCalledTimes(1)
    expect(prisma.userDevice.deleteMany.mock.invocationCallOrder[1]).toBeLessThan(
      prisma.userDevice.create.mock.invocationCallOrder[0],
    )
  })

  it('ném lỗi khi nhánh thử lại vẫn lỗi', async () => {
    const prisma = buildPrisma()
    prisma.userDevice.upsert.mockRejectedValue(buildP2002())
    prisma.userDevice.updateMany.mockResolvedValue({ count: 0 })
    prisma.userDevice.create.mockRejectedValue(buildP2002())
    const repository = new PrismaUserDeviceRepository(prisma as never)

    await expect(repository.upsertOwned(input)).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError)
  })

  it('không thử lại với lỗi khác P2002', async () => {
    const prisma = buildPrisma()
    prisma.userDevice.upsert.mockRejectedValue(new Error('db down'))
    const repository = new PrismaUserDeviceRepository(prisma as never)

    await expect(repository.upsertOwned(input)).rejects.toThrow('db down')
    expect(prisma.userDevice.updateMany).not.toHaveBeenCalled()
  })
})

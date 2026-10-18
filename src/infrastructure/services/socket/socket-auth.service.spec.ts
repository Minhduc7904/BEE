import { SocketAuthService } from './socket-auth.service'

describe('SocketAuthService account state', () => {
  const payload = {
    sub: 12,
    username: '0399520768',
    userType: 'parent' as const,
    parentId: 34,
  }

  function service(user: { isActive: boolean; deletedAt: Date | null } | null) {
    return new SocketAuthService(
      { verifyAccessToken: jest.fn().mockResolvedValue(payload) } as never,
      { user: { findUnique: jest.fn().mockResolvedValue(user) } } as never,
    )
  }

  it('cho phép socket mới của tài khoản đang hoạt động', async () => {
    await expect(service({ isActive: true, deletedAt: null }).validateToken('token')).resolves.toMatchObject({
      userId: 12,
      parentId: 34,
    })
  })

  it.each([
    ['đã xóa', { isActive: false, deletedAt: new Date('2026-10-18T00:00:00.000Z') }],
    ['bị khóa', { isActive: false, deletedAt: null }],
    ['không tồn tại', null],
  ])('từ chối socket khi tài khoản %s', async (_name, user) => {
    await expect(service(user).validateToken('token')).rejects.toMatchObject({ status: 401 })
  })
})

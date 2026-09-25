import { PrismaUserRefreshTokenRepository } from './prisma-user-refresh-token.repository'

describe('PrismaUserRefreshTokenRepository', () => {
  const findMany = jest.fn()
  const deleteMany = jest.fn()
  const repository = new PrismaUserRefreshTokenRepository({
    userRefreshToken: { findMany, deleteMany },
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('xóa đúng một batch token hết hạn trước cutoff', async () => {
    const cutoffAt = new Date('2026-09-25T03:20:00.000Z')
    findMany.mockResolvedValue([{ tokenId: 3 }, { tokenId: 8 }])
    deleteMany.mockResolvedValue({ count: 2 })

    await expect(repository.deleteExpiredTokens(cutoffAt, 1_000)).resolves.toBe(2)

    expect(findMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: cutoffAt } },
      orderBy: [{ expiresAt: 'asc' }, { tokenId: 'asc' }],
      take: 1_000,
      select: { tokenId: true },
    })
    expect(deleteMany).toHaveBeenCalledWith({
      where: { tokenId: { in: [3, 8] } },
    })
  })

  it('không chạy deleteMany khi không có token hết hạn', async () => {
    findMany.mockResolvedValue([])

    await expect(repository.deleteExpiredTokens(new Date(), 1_000)).resolves.toBe(0)

    expect(deleteMany).not.toHaveBeenCalled()
  })
})

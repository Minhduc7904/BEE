import { PrismaNotificationRepository } from './prisma-notification.repository'

describe('PrismaNotificationRepository reminder filtering', () => {
  it('adds an unread reminder JSON filter to the user notification query', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(0)
    const prisma = {
      notification: { findMany, count },
    }
    const repository = new PrismaNotificationRepository(prisma)

    await repository.findByUserIdWithPagination(
      42,
      { page: 1, limit: 50 },
      { isRead: false, reminder: true },
    )

    const query = findMany.mock.calls[0][0]
    expect(query.where).toEqual(
      expect.objectContaining({
        userId: 42,
        isRead: false,
        user: { isActive: true },
        AND: [
          {
            OR: [
              { data: { path: ['shouldShowReminderModal'], equals: true } },
              { data: { path: ['shouldShowReminderModal'], equals: 'true' } },
            ],
          },
        ],
      }),
    )
  })
})

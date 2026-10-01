import { NotificationLevel, NotificationType } from '../../shared/enums'
import { PrismaParentNotificationInboxRepository } from './parent-notification-inbox.repository'

const row = {
  notificationId: 42,
  userId: 20,
  title: 'Thông báo',
  message: 'Nội dung',
  type: NotificationType.SYSTEM,
  level: NotificationLevel.INFO,
  data: null,
  isRead: false,
  readAt: null,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  notificationDispatchRecipient: { sourceStudentId: null },
}

describe('PrismaParentNotificationInboxRepository', () => {
  it('lọc theo sourceStudentId trên relation, đồng thời giữ notification toàn tài khoản và cursor kép', async () => {
    const findMany = jest.fn().mockResolvedValue([row])
    const repository = new PrismaParentNotificationInboxRepository({ notification: { findMany } } as any)

    await repository.list({
      userId: 20,
      studentId: 10,
      after: { createdAt: row.createdAt, notificationId: 50 },
      limit: 20,
    })

    const where = findMany.mock.calls[0][0].where
    expect(where.userId).toBe(20)
    expect(JSON.stringify(where)).not.toContain('path')
    expect(where.AND[0].OR).toEqual([
      { createdAt: { lt: row.createdAt } },
      { createdAt: row.createdAt, notificationId: { lt: 50 } },
    ])
    expect(where.AND[1].OR).toEqual([
      { notificationDispatchRecipient: { is: { sourceStudentId: 10 } } },
      { notificationDispatchRecipient: { is: { sourceStudentId: null } } },
      { notificationDispatchRecipient: { is: null } },
    ])
  })

  it('tạo next cursor từ phần tử cuối trang và không lặp phần tử look-ahead', async () => {
    const rows = [row, { ...row, notificationId: 41 }, { ...row, notificationId: 40 }]
    const repository = new PrismaParentNotificationInboxRepository({
      notification: { findMany: jest.fn().mockResolvedValue(rows) },
    } as any)

    const page = await repository.list({ userId: 20, after: null, limit: 2 })

    expect(page.data.map((item) => item.notificationId)).toEqual([42, 41])
    expect(page.hasNext).toBe(true)
    expect(page.nextCursor).toBe(`${row.createdAt.getTime()}_41`)
  })
})

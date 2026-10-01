import type { AuthenticatedUser, ParentNotificationInboxItem } from '../../interfaces'
import { ParentNotificationInboxRepository } from '../../interfaces'
import { NotificationChangeReason, NotificationLevel, NotificationType } from '../../../shared/enums'
import { GetParentNotificationUseCase } from './get-parent-notification.use-case'
import { GetParentNotificationsUseCase } from './get-parent-notifications.use-case'
import { MarkParentNotificationReadUseCase } from './mark-parent-notification-read.use-case'
import { ParentNotificationInboxQueryDto } from '../../dtos'
import { ValidationException } from '../../../shared/exceptions/custom-exceptions'

const identity: AuthenticatedUser = {
  userId: 20,
  username: 'parent',
  userType: 'parent',
  parentId: 7,
  roles: [],
  permissions: [],
}

const notification: ParentNotificationInboxItem = {
  notificationId: 42,
  userId: 20,
  sourceStudentId: 10,
  title: 'Điểm danh',
  message: 'Có mặt',
  type: NotificationType.ATTENDANCE,
  level: NotificationLevel.INFO,
  data: { attendanceId: '99' },
  isRead: false,
  readAt: null,
  createdAt: new Date('2026-10-01T00:00:00Z'),
}

function mockInbox(overrides: Partial<ParentNotificationInboxRepository> = {}): ParentNotificationInboxRepository {
  return {
    isStudentLinked: jest.fn().mockResolvedValue(true),
    list: jest.fn().mockResolvedValue({ data: [notification], hasNext: false, nextCursor: null }),
    getStats: jest.fn().mockResolvedValue({ total: 1, unread: 1, read: 0 }),
    findOwnedById: jest.fn().mockResolvedValue(notification),
    markRead: jest.fn().mockResolvedValue({ notification: { ...notification, isRead: true }, changed: true }),
    ...overrides,
  }
}

describe('Parent notification inbox use cases', () => {
  it('trả 400 cho cursor số nhưng vượt miền Date an toàn', () => {
    const query = new ParentNotificationInboxQueryDto()
    query.after = '999999999999999999999_42'
    expect(() => query.toPagination()).toThrow(ValidationException)
  })

  it('kiểm tra học sinh thuộc phụ huynh trước khi list và luôn truyền userId từ token', async () => {
    const list = jest.fn().mockResolvedValue({ data: [notification], hasNext: false, nextCursor: null })
    const isStudentLinked = jest.fn().mockResolvedValue(true)
    const inbox = mockInbox({ isStudentLinked, list })
    const useCase = new GetParentNotificationsUseCase(inbox)

    await useCase.execute(identity, { studentId: 10, limit: 20, toPagination: () => ({ after: null, limit: 20 }) })

    expect(isStudentLinked).toHaveBeenCalledWith(7, 10)
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ userId: 20, studentId: 10, limit: 20 }))
  })

  it('từ chối studentId không thuộc phụ huynh trước khi đọc inbox', async () => {
    const list = jest.fn()
    const inbox = mockInbox({ isStudentLinked: jest.fn().mockResolvedValue(false), list })

    await expect(
      new GetParentNotificationsUseCase(inbox).execute(identity, {
        studentId: 999,
        toPagination: () => ({ after: null, limit: 20 }),
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(list).not.toHaveBeenCalled()
  })

  it('không trả chi tiết notification của tài khoản khác', async () => {
    const findOwnedById = jest.fn().mockResolvedValue(null)
    const inbox = mockInbox({ findOwnedById })
    await expect(new GetParentNotificationUseCase(inbox).execute(identity, 42)).rejects.toMatchObject({ status: 404 })
    expect(findOwnedById).toHaveBeenCalledWith(20, 42)
  })

  it('mark-read idempotent và chỉ emit invalidation khi trạng thái thực sự đổi', async () => {
    const markRead = jest
      .fn()
      .mockResolvedValueOnce({ notification: { ...notification, isRead: true }, changed: true })
      .mockResolvedValueOnce({ notification: { ...notification, isRead: true }, changed: false })
    const notifyChanged = jest.fn()
    const useCase = new MarkParentNotificationReadUseCase(mockInbox({ markRead }), { notifyChanged } as any)

    await useCase.execute(identity, 42)
    await useCase.execute(identity, 42)

    expect(markRead).toHaveBeenNthCalledWith(1, 20, 42)
    expect(notifyChanged).toHaveBeenCalledTimes(1)
    expect(notifyChanged).toHaveBeenCalledWith(20, {
      reason: NotificationChangeReason.READ,
      notificationId: 42,
    })
  })
})

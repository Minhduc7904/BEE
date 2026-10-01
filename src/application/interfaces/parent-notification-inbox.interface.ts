import type { NotificationLevel, NotificationType } from '../../shared/enums'

export interface ParentNotificationCursor {
  createdAt: Date
  notificationId: number
}

export interface ParentNotificationInboxQuery {
  userId: number
  studentId?: number
  type?: NotificationType
  isRead?: boolean
  after: ParentNotificationCursor | null
  limit: number
}

export interface ParentNotificationInboxItem {
  notificationId: number
  userId: number
  sourceStudentId: number | null
  title: string
  message: string
  type: NotificationType
  level: NotificationLevel
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

export interface ParentNotificationInboxPage {
  data: ParentNotificationInboxItem[]
  hasNext: boolean
  nextCursor: string | null
}

export interface ParentNotificationInboxStats {
  total: number
  unread: number
  read: number
}

export interface MarkParentNotificationReadResult {
  notification: ParentNotificationInboxItem | null
  changed: boolean
}

export abstract class ParentNotificationInboxRepository {
  abstract isStudentLinked(parentId: number, studentId: number): Promise<boolean>
  abstract list(query: ParentNotificationInboxQuery): Promise<ParentNotificationInboxPage>
  abstract getStats(userId: number): Promise<ParentNotificationInboxStats>
  abstract findOwnedById(userId: number, notificationId: number): Promise<ParentNotificationInboxItem | null>
  abstract markRead(userId: number, notificationId: number): Promise<MarkParentNotificationReadResult>
}

export function encodeParentNotificationCursor(createdAt: Date, notificationId: number): string {
  return `${createdAt.getTime()}_${notificationId}`
}

export function decodeParentNotificationCursor(value: string): ParentNotificationCursor {
  const [epochText, idText] = value.split('_')
  const epoch = Number(epochText)
  const notificationId = Number(idText)
  const createdAt = new Date(epoch)
  if (!Number.isSafeInteger(epoch) || epoch < 0 || !Number.isSafeInteger(notificationId) || notificationId <= 0) {
    throw new Error('INVALID_PARENT_NOTIFICATION_CURSOR')
  }
  if (Number.isNaN(createdAt.getTime())) throw new Error('INVALID_PARENT_NOTIFICATION_CURSOR')
  return { createdAt, notificationId }
}

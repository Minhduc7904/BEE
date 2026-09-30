import { NotificationRecipientKind, NotificationRecipientType } from '../../../shared/enums'

export class NotificationDispatchRecipient {
  notificationDispatchRecipientId: number
  notificationDispatchJobId: number
  createdAt: Date
  updatedAt: Date
  userId?: number
  recipientKey?: string
  recipientKind: NotificationRecipientKind
  recipientType: NotificationRecipientType
  sourceStudentId?: number
  profileId?: number
  displayName?: string
  email?: string
  phone?: string

  constructor(data: {
    notificationDispatchRecipientId: number
    notificationDispatchJobId: number
    createdAt: Date
    updatedAt: Date
    userId?: number
    recipientKey?: string
    recipientKind: NotificationRecipientKind
    recipientType: NotificationRecipientType
    sourceStudentId?: number
    profileId?: number
    displayName?: string
    email?: string
    phone?: string
  }) {
    Object.assign(this, data)
  }
}

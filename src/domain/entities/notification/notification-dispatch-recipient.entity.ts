import { NotificationRecipientType } from '../../../shared/enums'

export class NotificationDispatchRecipient {
  notificationDispatchRecipientId: number
  notificationDispatchJobId: number
  createdAt: Date
  updatedAt: Date
  userId?: number
  recipientType: NotificationRecipientType
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
    recipientType: NotificationRecipientType
    profileId?: number
    displayName?: string
    email?: string
    phone?: string
  }) {
    Object.assign(this, data)
  }
}

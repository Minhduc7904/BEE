export class NotificationDispatchRecipient {
  notificationDispatchRecipientId: number
  notificationDispatchJobId: number
  createdAt: Date
  updatedAt: Date
  userId?: number

  constructor(data: {
    notificationDispatchRecipientId: number
    notificationDispatchJobId: number
    createdAt: Date
    updatedAt: Date
    userId?: number
  }) {
    Object.assign(this, data)
  }
}

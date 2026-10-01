import { MESSAGE_MAPPING_METADATA, MESSAGE_METADATA } from '@nestjs/websockets/constants'
import { NotificationGateway } from './notification.gateway'

describe('NotificationGateway room security', () => {
  it('does not expose generic room join or leave subscriptions', () => {
    const subscribedMessages = Object.getOwnPropertyNames(NotificationGateway.prototype)
      .map((methodName) => NotificationGateway.prototype[methodName as keyof NotificationGateway])
      .filter(
        (handler): handler is (...args: unknown[]) => unknown =>
          typeof handler === 'function' && Reflect.getMetadata(MESSAGE_MAPPING_METADATA, handler),
      )
      .map((handler) => Reflect.getMetadata(MESSAGE_METADATA, handler))

    expect(subscribedMessages).not.toContain('join-room')
    expect(subscribedMessages).not.toContain('leave-room')
    expect(subscribedMessages).toEqual(expect.arrayContaining(['mark-notification-read', 'delete-notification']))
  })
})

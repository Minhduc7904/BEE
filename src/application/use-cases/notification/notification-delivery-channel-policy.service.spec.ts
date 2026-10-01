import { NotificationDeliveryChannel } from '../../../shared/enums'
import { NotificationDeliveryChannelPolicyService } from './notification-delivery-channel-policy.service'

describe('NotificationDeliveryChannelPolicyService', () => {
  it('mặc định chỉ bật IN_APP khi PUSH tắt', () => {
    const policy = new NotificationDeliveryChannelPolicyService({ pushEnabled: false })

    expect(policy.enabledInAppChannels()).toEqual([NotificationDeliveryChannel.IN_APP])
    expect(policy.isEnabled(NotificationDeliveryChannel.PUSH)).toBe(false)
    expect(() => policy.assertExplicitChannelsEnabled([NotificationDeliveryChannel.PUSH])).toThrow(
      expect.objectContaining({ response: expect.objectContaining({ code: 'CHANNEL_DISABLED' }) }),
    )
  })

  it('bật lại PUSH mà không phụ thuộc FIREBASE_ENABLED', () => {
    const policy = new NotificationDeliveryChannelPolicyService({ pushEnabled: true })

    expect(policy.enabledInAppChannels()).toEqual([
      NotificationDeliveryChannel.IN_APP,
      NotificationDeliveryChannel.PUSH,
    ])
    expect(() => policy.assertExplicitChannelsEnabled([NotificationDeliveryChannel.PUSH])).not.toThrow()
  })
})

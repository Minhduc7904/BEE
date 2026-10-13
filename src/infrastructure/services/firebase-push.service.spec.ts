import { FirebasePushService } from './firebase-push.service'

const sendEachForMulticast = jest.fn()

jest.mock('firebase-admin/app', () => ({
  cert: jest.fn((value: unknown) => value),
  getApp: jest.fn(),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(() => ({ name: 'bee-fcm' })),
}))
jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(() => ({ sendEachForMulticast })),
}))

const baseConfig = {
  enabled: false,
  projectId: undefined,
  clientEmail: undefined,
  privateKey: undefined,
  dryRun: false,
  androidChannelId: 'bee_default',
}

const enabledConfig = {
  ...baseConfig,
  enabled: true,
  projectId: 'bee',
  clientEmail: 'bee@example.com',
  privateKey: 'key',
}

describe('FirebasePushService', () => {
  beforeEach(() => {
    sendEachForMulticast.mockReset()
  })

  it('không gửi gì và không lỗi khi FIREBASE_ENABLED tắt', async () => {
    const service = new FirebasePushService(baseConfig)

    await expect(service.sendToTokens(['token-a'], { title: 'Tiêu đề', body: 'Nội dung' })).resolves.toEqual({
      providerAvailable: false,
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      outcomes: [],
    })
  })

  it('báo lỗi cấu hình khi bật Firebase nhưng thiếu thông tin service account', () => {
    expect(() => new FirebasePushService({ ...baseConfig, enabled: true, projectId: 'bee' })).toThrow(
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL và FIREBASE_PRIVATE_KEY là bắt buộc khi bật Firebase',
    )
  })

  it('dựng message Android/APNs đúng cấu trúc', async () => {
    sendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true, messageId: 'm-1' }],
    })
    const service = new FirebasePushService(enabledConfig)

    await service.sendToTokens(['token-a'], {
      title: 'Tiêu đề',
      body: 'Nội dung',
      data: { notificationId: '41', type: 'ATTENDANCE' },
    })

    const [message, dryRun] = sendEachForMulticast.mock.calls[0]
    expect(dryRun).toBe(false)
    expect(message).toEqual(
      expect.objectContaining({
        tokens: ['token-a'],
        notification: { title: 'Tiêu đề', body: 'Nội dung' },
        data: { notificationId: '41', type: 'ATTENDANCE' },
        android: {
          priority: 'high',
          ttl: 86_400_000,
          notification: { channelId: 'bee_default', sound: 'default', tag: '41' },
        },
      }),
    )
    expect(message.apns.headers).toEqual(expect.objectContaining({ 'apns-priority': '10', 'apns-push-type': 'alert' }))
    expect(Number(message.apns.headers['apns-expiration'])).toBeGreaterThan(Date.now() / 1000)
    expect(message.apns.payload.aps).toEqual({ sound: 'default', 'thread-id': 'ATTENDANCE' })
  })

  it('bỏ tag và thread-id khi data không có notificationId/type', async () => {
    sendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true, messageId: 'm-1' }],
    })
    const service = new FirebasePushService(enabledConfig)

    await service.sendToTokens(['token-a'], { title: 'T', body: 'B' })

    const [message] = sendEachForMulticast.mock.calls[0]
    expect(message.android.notification).toEqual({ channelId: 'bee_default', sound: 'default' })
    expect(message.apns.payload.aps).toEqual({ sound: 'default' })
  })

  it('chia token thành từng nhóm tối đa 500', async () => {
    sendEachForMulticast.mockImplementation((message: { tokens: string[] }) =>
      Promise.resolve({
        successCount: message.tokens.length,
        failureCount: 0,
        responses: message.tokens.map(() => ({ success: true, messageId: 'm' })),
      }),
    )
    const service = new FirebasePushService(enabledConfig)
    const tokens = Array.from({ length: 1001 }, (_, index) => `token-${index}`)

    const result = await service.sendToTokens(tokens, { title: 'T', body: 'B' })

    expect(sendEachForMulticast).toHaveBeenCalledTimes(3)
    expect(sendEachForMulticast.mock.calls.map(([message]) => message.tokens.length)).toEqual([500, 500, 1])
    expect(result.successCount).toBe(1001)
    expect(result.outcomes).toHaveLength(1001)
  })

  it('map outcome invalid, retryable và permanent', async () => {
    sendEachForMulticast.mockResolvedValue({
      successCount: 0,
      failureCount: 3,
      responses: [
        { success: false, error: { code: 'messaging/registration-token-not-registered' } },
        { success: false, error: { code: 'messaging/server-unavailable' } },
        { success: false, error: { code: 'messaging/third-party-auth-error' } },
      ],
    })
    const service = new FirebasePushService(enabledConfig)

    const result = await service.sendToTokens(['t-invalid', 't-retry', 't-perm'], { title: 'T', body: 'B' })

    expect(result.invalidTokens).toEqual(['t-invalid'])
    expect(result.outcomes).toEqual([
      expect.objectContaining({ token: 't-invalid', success: false, retryable: false }),
      expect.objectContaining({ token: 't-retry', success: false, retryable: true }),
      expect.objectContaining({
        token: 't-perm',
        success: false,
        retryable: false,
        errorCode: 'messaging/third-party-auth-error',
      }),
    ])
  })
})

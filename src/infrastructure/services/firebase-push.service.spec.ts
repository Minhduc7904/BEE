import { FirebasePushService } from './firebase-push.service'

const baseConfig = {
  enabled: false,
  projectId: undefined,
  clientEmail: undefined,
  privateKey: undefined,
  dryRun: false,
  androidChannelId: 'bee_default',
}

describe('FirebasePushService', () => {
  it('không gửi gì và không lỗi khi FIREBASE_ENABLED tắt', async () => {
    const service = new FirebasePushService(baseConfig)

    await expect(service.sendToTokens(['token-a'], { title: 'Tiêu đề', body: 'Nội dung' })).resolves.toEqual({
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
    })
  })

  it('báo lỗi cấu hình khi bật Firebase nhưng thiếu thông tin service account', () => {
    expect(() => new FirebasePushService({ ...baseConfig, enabled: true, projectId: 'bee' })).toThrow(
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL và FIREBASE_PRIVATE_KEY là bắt buộc khi bật Firebase',
    )
  })
})

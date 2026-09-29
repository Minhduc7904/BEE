// src/infrastructure/services/firebase-push.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging, type Messaging, type MulticastMessage } from 'firebase-admin/messaging'
import firebaseConfig from '../../config/firebase.config'
import type {
  PushNotificationMessage,
  PushNotificationSendResult,
} from '../../application/interfaces/push-notification.interface'
import { PushNotificationService } from '../../application/interfaces/push-notification.interface'

const FIREBASE_APP_NAME = 'bee-fcm'
// FCM cho phép tối đa 500 token cho mỗi lần gửi multicast.
const FCM_MULTICAST_LIMIT = 500
const INVALID_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
])
const RETRYABLE_ERROR_CODES = new Set([
  'messaging/internal-error',
  'messaging/server-unavailable',
  'messaging/quota-exceeded',
  'messaging/unknown-error',
])

@Injectable()
export class FirebasePushService implements PushNotificationService {
  private readonly logger = new Logger(FirebasePushService.name)
  private readonly messaging: Messaging | null

  constructor(
    @Inject(firebaseConfig.KEY)
    private readonly config: ConfigType<typeof firebaseConfig>,
  ) {
    if (!this.config.enabled) {
      this.messaging = null
      this.logger.warn('Gửi thông báo đẩy đang tắt qua FIREBASE_ENABLED')
      return
    }

    if (!this.config.projectId || !this.config.clientEmail || !this.config.privateKey) {
      throw new Error('FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL và FIREBASE_PRIVATE_KEY là bắt buộc khi bật Firebase')
    }

    const app = getApps().some((existing) => existing.name === FIREBASE_APP_NAME)
      ? getApp(FIREBASE_APP_NAME)
      : initializeApp(
          {
            credential: cert({
              projectId: this.config.projectId,
              clientEmail: this.config.clientEmail,
              privateKey: this.config.privateKey,
            }),
          },
          FIREBASE_APP_NAME,
        )

    this.messaging = getMessaging(app)
    this.logger.log(`Firebase Cloud Messaging đã khởi tạo${this.config.dryRun ? ' (dry-run)' : ''}`)
  }

  async sendToTokens(tokens: string[], message: PushNotificationMessage): Promise<PushNotificationSendResult> {
    const uniqueTokens = Array.from(new Set(tokens.filter((token) => token.length > 0)))
    const result: PushNotificationSendResult = {
      providerAvailable: this.messaging !== null,
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      outcomes: [],
    }

    if (!this.messaging || uniqueTokens.length === 0) {
      return result
    }

    for (let start = 0; start < uniqueTokens.length; start += FCM_MULTICAST_LIMIT) {
      const chunk = uniqueTokens.slice(start, start + FCM_MULTICAST_LIMIT)
      const response = await this.messaging.sendEachForMulticast(this.buildMessage(chunk, message), this.config.dryRun)

      result.successCount += response.successCount
      result.failureCount += response.failureCount
      response.responses.forEach((sendResponse, index) => {
        const token = chunk[index]
        const errorCode = sendResponse.error?.code
        result.outcomes.push({
          token,
          success: sendResponse.success,
          messageId: sendResponse.messageId,
          errorCode,
          retryable: errorCode ? RETRYABLE_ERROR_CODES.has(errorCode) : false,
        })
        if (!sendResponse.success && sendResponse.error && INVALID_TOKEN_ERROR_CODES.has(sendResponse.error.code)) {
          result.invalidTokens.push(token)
        }
      })
    }

    // Chỉ log số lượng, không log token hoặc nội dung thông báo.
    this.logger.log(
      `Gửi thông báo đẩy: thành công=${result.successCount}, thất bại=${result.failureCount}, token hỏng=${result.invalidTokens.length}`,
    )

    return result
  }

  private buildMessage(tokens: string[], message: PushNotificationMessage): MulticastMessage {
    return {
      tokens,
      notification: { title: message.title, body: message.body },
      data: message.data,
      android: {
        priority: 'high',
        notification: { channelId: this.config.androidChannelId },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    }
  }
}

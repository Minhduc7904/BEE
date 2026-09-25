/** Nội dung một thông báo đẩy gửi tới thiết bị. */
export interface PushNotificationMessage {
  title: string
  body: string
  /** Dữ liệu kèm theo (điều hướng khi bấm thông báo); FCM chỉ nhận giá trị chuỗi. */
  data?: Record<string, string>
}

export interface PushNotificationSendResult {
  successCount: number
  failureCount: number
  /** FCM token không còn hợp lệ (đã gỡ app hoặc token hết hiệu lực); nơi gọi nên xóa thiết bị tương ứng. */
  invalidTokens: string[]
}

/** Application port and Nest injection token for the push notification (FCM) service. */
export abstract class PushNotificationService {
  abstract sendToTokens(tokens: string[], message: PushNotificationMessage): Promise<PushNotificationSendResult>
}

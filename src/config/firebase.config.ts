// src/config/firebase.config.ts
import { registerAs } from '@nestjs/config'

const optional = (value?: string): string | undefined => value?.trim() || undefined

export default registerAs('firebase', () => ({
  enabled: optional(process.env.FIREBASE_ENABLED)?.toLowerCase() === 'true',
  projectId: optional(process.env.FIREBASE_PROJECT_ID),
  clientEmail: optional(process.env.FIREBASE_CLIENT_EMAIL),
  // Private key trong .env thường chứa ký tự xuống dòng dạng chuỗi "\n" nên cần chuyển lại thành xuống dòng thật.
  privateKey: optional(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
  // dryRun: FCM chỉ kiểm tra hợp lệ tin nhắn, không gửi tới thiết bị thật.
  dryRun: optional(process.env.FCM_DRY_RUN)?.toLowerCase() === 'true',
  // Phải trùng với notification channel mà app Android tạo.
  androidChannelId: optional(process.env.FCM_ANDROID_CHANNEL_ID) || 'bee_default',
}))

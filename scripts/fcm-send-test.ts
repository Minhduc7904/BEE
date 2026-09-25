// scripts/fcm-send-test.ts
// Gửi thử một thông báo FCM tới một token để kiểm tra cấu hình Firebase (không phải endpoint của ứng dụng).
// Cách dùng: npx ts-node scripts/fcm-send-test.ts <fcmToken> ["Tiêu đề"] ["Nội dung"]
// Đặt FCM_DRY_RUN=true để chỉ kiểm tra hợp lệ, không gửi tới thiết bị.
import * as dotenv from 'dotenv'
import { cert, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

dotenv.config()

async function main(): Promise<void> {
  const [token, title = 'BeeEdu', body = 'Thông báo thử nghiệm từ BeeEdu'] = process.argv.slice(2)
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/\\n/g, '\n')

  if (!token) {
    throw new Error('Thiếu FCM token: npx ts-node scripts/fcm-send-test.ts <fcmToken> ["Tiêu đề"] ["Nội dung"]')
  }
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Thiếu FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL hoặc FIREBASE_PRIVATE_KEY trong .env')
  }

  const dryRun = process.env.FCM_DRY_RUN?.trim().toLowerCase() === 'true'
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  const messageId = await getMessaging(app).send(
    {
      token,
      notification: { title, body },
      android: { priority: 'high', notification: { channelId: process.env.FCM_ANDROID_CHANNEL_ID || 'bee_default' } },
      apns: { payload: { aps: { sound: 'default' } } },
    },
    dryRun,
  )

  console.log(`${dryRun ? '[dry-run] ' : ''}Đã gửi, messageId=${messageId}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

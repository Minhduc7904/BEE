import { registerAs } from '@nestjs/config'

export default registerAs('notificationDelivery', () => ({
  pushEnabled: process.env.NOTIFICATION_PUSH_ENABLED?.trim().toLowerCase() === 'true',
}))

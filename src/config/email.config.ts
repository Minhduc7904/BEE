// src/config/email.config.ts
import { registerAs } from '@nestjs/config'

const optional = (value?: string): string | undefined => value?.trim() || undefined

export default registerAs('email', () => ({
  resendApiKey: optional(process.env.RESEND_API_KEY),
  fromName: optional(process.env.MAIL_FROM_NAME) || 'Bee Education',
  fromAddress: optional(process.env.MAIL_FROM_ADDRESS) || 'onboarding@resend.dev',
  replyTo: optional(process.env.MAIL_REPLY_TO),
  enabled: optional(process.env.MAIL_ENABLED)?.toLowerCase() === 'true',
  appName: optional(process.env.MAIL_FROM_NAME) || 'Bee Education',
  apiBaseUrl: (optional(process.env.API_BASE_URL) || `${optional(process.env.APP_URL) || 'http://localhost:3001'}/api`).replace(/\/$/, ''),
}))

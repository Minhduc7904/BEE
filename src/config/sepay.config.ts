import { registerAs } from '@nestjs/config'

const optional = (value?: string): string | undefined => value?.trim() || undefined

export const SepayConfig = registerAs('sepay', () => ({
  apiKey: optional(process.env.SEPAY_API_KEY),
  apiBaseUrl: (optional(process.env.SEPAY_API_BASE_URL) || 'https://my.sepay.vn/userapi').replace(/\/$/, ''),
  v2ApiBaseUrl: (optional(process.env.SEPAY_V2_API_BASE_URL) || 'https://userapi.sepay.vn/v2').replace(/\/$/, ''),
  apiTimeoutMs: Number.parseInt(process.env.SEPAY_API_TIMEOUT_MS || '15000', 10),
  webhookSecret: optional(process.env.SEPAY_WEBHOOK_SECRET),
  qrBaseUrl: (optional(process.env.SEPAY_QR_BASE_URL) || 'https://qr.sepay.vn').replace(/\/$/, ''),
  attemptExpiryMinutes: Number.parseInt(process.env.SEPAY_ATTEMPT_EXPIRY_MINUTES || '30', 10),
}))

export default SepayConfig

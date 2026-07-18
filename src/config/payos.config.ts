import { registerAs } from '@nestjs/config'

const getOptionalValue = (value?: string): string | undefined => value?.trim() || undefined

const joinUrl = (baseUrl: string | undefined, path: string): string | undefined => {
  if (!baseUrl) return undefined
  return `${baseUrl.replace(/\/$/, '')}${path}`
}

export const PayosConfig = registerAs('payos', () => {
  const appUrl = getOptionalValue(process.env.APP_URL)

  return {
    apiUrl: (getOptionalValue(process.env.PAYOS_API_URL) || 'https://api-merchant.payos.vn').replace(/\/$/, ''),
    clientId: getOptionalValue(process.env.CLIENT_ID_PAYOS),
    apiKey: getOptionalValue(process.env.API_KEY_PAYOS),
    checksumKey: getOptionalValue(process.env.CHECKSUM_KEY_PAYOS),
    returnUrl: getOptionalValue(process.env.PAYOS_RETURN_URL) || joinUrl(appUrl, '/student/payos/return'),
    cancelUrl: getOptionalValue(process.env.PAYOS_CANCEL_URL) || joinUrl(appUrl, '/student/payos/cancel'),
    webhookConfirmationOnly: process.env.PAYOS_WEBHOOK_CONFIRMATION_ONLY?.trim().toLowerCase() === 'true',
  }
})

export default PayosConfig

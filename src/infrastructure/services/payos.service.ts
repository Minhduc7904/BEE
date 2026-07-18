import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { createHmac, timingSafeEqual } from 'crypto'
import type {
  CreatePayosPaymentLinkInput,
  PayosPaymentLink,
  PayosService as PayosServicePort,
  PayosWebhookData,
  PayosWebhookEvent,
} from 'src/application/interfaces/payos.interface'

type PayosEnvelope<T> = {
  code: string
  desc: string
  data?: T
  signature?: string
}

type PayosWebhookPayload = PayosWebhookEvent & { signature: string }

@Injectable()
export class PayosService implements PayosServicePort {
  constructor(private readonly configService: ConfigService) {}

  async createPaymentLink(input: CreatePayosPaymentLinkInput): Promise<PayosPaymentLink> {
    const payload = {
      orderCode: input.orderCode,
      amount: input.amount,
      description: input.description,
      items: input.items,
      cancelUrl: this.getRedirectUrl('PAYOS_CANCEL_URL', '/student/payos-cancel'),
      returnUrl: this.getRedirectUrl('PAYOS_RETURN_URL', '/student/payos-return'),
      expiredAt: input.expiredAt,
    }
    const signature = this.signPaymentRequest(payload)

    try {
      const response = await axios.post<PayosEnvelope<PayosPaymentLink>>(
        `${this.getApiUrl()}/v2/payment-requests`,
        { ...payload, signature },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': this.requireEnv('CLIENT_ID_PAYOS'),
            'x-api-key': this.requireEnv('API_KEY_PAYOS'),
          },
          timeout: 15_000,
        },
      )

      const { data } = response.data
      if (response.data.code !== '00' || !data) {
        throw new BadGatewayException(response.data.desc || 'PayOS khong the tao link thanh toan')
      }

      if (
        response.data.signature &&
        !this.isValidSignature(data as unknown as Record<string, unknown>, response.data.signature)
      ) {
        throw new BadGatewayException('Chu ky phan hoi PayOS khong hop le')
      }

      if (!data.paymentLinkId || !data.checkoutUrl || !data.qrCode) {
        throw new BadGatewayException('PayOS tra ve link thanh toan khong hop le')
      }

      return data
    } catch (error) {
      if (error instanceof BadGatewayException) throw error

      if (this.isAxiosError(error)) {
        const providerMessage = error.response?.data?.desc
        throw new BadGatewayException(providerMessage || 'Khong the ket noi PayOS')
      }

      throw error
    }
  }

  verifyWebhook(payload: unknown): PayosWebhookEvent {
    if (!this.isWebhookPayload(payload)) {
      throw new BadRequestException('Webhook PayOS khong hop le')
    }

    if (!this.isValidSignature(payload.data as unknown as Record<string, unknown>, payload.signature)) {
      throw new BadRequestException('Chu ky webhook PayOS khong hop le')
    }

    return {
      code: payload.code,
      desc: payload.desc,
      success: payload.success,
      data: payload.data,
    }
  }

  private signPaymentRequest(payload: Record<string, unknown>): string {
    const signatureData = {
      amount: payload.amount,
      cancelUrl: payload.cancelUrl,
      description: payload.description,
      orderCode: payload.orderCode,
      returnUrl: payload.returnUrl,
    }

    return this.createSignature(signatureData)
  }

  private isValidSignature(data: Record<string, unknown>, signature: string): boolean {
    const expectedSignature = this.createSignature(data)
    const expected = Buffer.from(expectedSignature, 'hex')
    const received = Buffer.from(signature, 'hex')

    return expected.length === received.length && timingSafeEqual(expected, received)
  }

  private createSignature(data: Record<string, unknown>): string {
    return createHmac('sha256', this.requireEnv('CHECKSUM_KEY_PAYOS'))
      .update(this.toSignatureData(data), 'utf8')
      .digest('hex')
  }

  private toSignatureData(data: Record<string, unknown>): string {
    return Object.keys(data)
      .sort()
      .map((key) => `${key}=${this.toSignatureValue(data[key])}`)
      .join('&')
  }

  private toSignatureValue(value: unknown): string {
    if (value === null || value === undefined || value === 'null' || value === 'undefined') return ''
    if (Array.isArray(value)) return JSON.stringify(value.map((item) => this.sortObject(item)))
    if (typeof value === 'object') return JSON.stringify(this.sortObject(value))
    return String(value)
  }

  private sortObject(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sortObject(item))
    if (!value || typeof value !== 'object') return value

    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = this.sortObject((value as Record<string, unknown>)[key])
        return result
      }, {})
  }

  private isWebhookPayload(payload: unknown): payload is PayosWebhookPayload {
    if (!payload || typeof payload !== 'object') return false
    const webhook = payload as Partial<PayosWebhookPayload>

    return (
      typeof webhook.code === 'string' &&
      typeof webhook.desc === 'string' &&
      typeof webhook.success === 'boolean' &&
      typeof webhook.signature === 'string' &&
      !!webhook.data &&
      typeof webhook.data === 'object' &&
      typeof webhook.data.orderCode === 'number' &&
      typeof webhook.data.amount === 'number'
    )
  }

  private isAxiosError(error: unknown): error is { response?: { data?: { desc?: string } } } {
    return !!error && typeof error === 'object' && 'isAxiosError' in error
  }

  private getApiUrl(): string {
    return (this.configService.get<string>('PAYOS_API_URL') || 'https://api-merchant.payos.vn').replace(/\/$/, '')
  }

  private getRedirectUrl(key: string, fallbackPath: string): string {
    const configuredUrl = this.configService.get<string>(key)?.trim()
    if (configuredUrl) return configuredUrl

    const appUrl = this.configService.get<string>('APP_URL')?.trim().replace(/\/$/, '')
    if (appUrl) return `${appUrl}${fallbackPath}`

    throw new InternalServerErrorException(`Missing environment variable: ${key} or APP_URL`)
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key)
    if (!value?.trim()) {
      throw new InternalServerErrorException(`Missing environment variable: ${key}`)
    }
    return value.trim()
  }
}

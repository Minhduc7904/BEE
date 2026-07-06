import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'crypto'
import * as querystring from 'querystring'

type VnpayQuery = Record<string, any>

export interface CreateVnpayPaymentUrlInput {
  txnRef: string
  amount: number
  orderInfo: string
  ipAddr?: string
  createDate?: Date
  expireDate?: Date
}

export interface CreateVnpayPaymentUrlResult {
  paymentUrl: string
  requestPayload: Record<string, string>
}

export interface VnpayVerifyResult {
  isVerified: boolean
  isSuccess: boolean
  txnRef?: string
  amount?: number
  responseCode?: string
  transactionStatus?: string
  transactionNo?: string
  bankCode?: string
  bankTranNo?: string
  cardType?: string
  payDate?: string
  message?: string
}

@Injectable()
export class VnpayService {
  constructor(private readonly configService: ConfigService) {}

  createPaymentUrl(input: CreateVnpayPaymentUrlInput): CreateVnpayPaymentUrlResult {
    const paymentUrl = this.requireEnv('VNPAY_PAYMENT_URL')
    const tmnCode = this.requireEnv('VNPAY_TMN_CODE')
    const returnUrl = this.requireEnv('VNPAY_RETURN_URL')
    const ipnUrl = this.requireEnv('VNPAY_IPN_URL')
    const locale = this.requireEnv('VNPAY_LOCALE')
    const currCode = this.requireEnv('VNPAY_CURR_CODE')

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(input.amount * 100),
      vnp_CurrCode: currCode,
      vnp_TxnRef: input.txnRef,
      vnp_OrderInfo: input.orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: locale,
      vnp_ReturnUrl: returnUrl,
      vnp_IpnUrl: ipnUrl,
      vnp_IpAddr: input.ipAddr || '127.0.0.1',
      vnp_CreateDate: this.formatVnpayDate(input.createDate ?? new Date()),
    }

    if (input.expireDate) {
      params.vnp_ExpireDate = this.formatVnpayDate(input.expireDate)
    }

    const signedParams = this.signParams(params)
    const url = `${paymentUrl}?${this.buildQueryString(signedParams)}`

    return {
      paymentUrl: url,
      requestPayload: signedParams,
    }
  }

  verifyIpn(query: VnpayQuery): VnpayVerifyResult {
    return this.verifyQuery(query)
  }

  verifyReturnUrl(query: VnpayQuery): VnpayVerifyResult {
    return this.verifyQuery(query)
  }

  private verifyQuery(query: VnpayQuery): VnpayVerifyResult {
    const secureHash = String(query.vnp_SecureHash || '')
    const params = this.normalizeParams(query)
    delete params.vnp_SecureHash
    delete params.vnp_SecureHashType

    const expectedHash = this.createSecureHash(params)
    const responseCode = params.vnp_ResponseCode
    const transactionStatus = params.vnp_TransactionStatus

    return {
      isVerified: secureHash.toLowerCase() === expectedHash.toLowerCase(),
      isSuccess: responseCode === '00' && transactionStatus === '00',
      txnRef: params.vnp_TxnRef,
      amount: params.vnp_Amount ? Number(params.vnp_Amount) / 100 : undefined,
      responseCode,
      transactionStatus,
      transactionNo: params.vnp_TransactionNo,
      bankCode: params.vnp_BankCode,
      bankTranNo: params.vnp_BankTranNo,
      cardType: params.vnp_CardType,
      payDate: params.vnp_PayDate,
      message: params.vnp_Message,
    }
  }

  private signParams(params: Record<string, string>): Record<string, string> {
    return {
      ...params,
      vnp_SecureHash: this.createSecureHash(params),
    }
  }

  private createSecureHash(params: Record<string, string>): string {
    const hashSecret = this.requireEnv('VNPAY_HASH_SECRET')
    const sortedParams = this.sortParams(params)
    const signData = querystring.stringify(sortedParams, undefined, undefined, { encodeURIComponent: (value) => value })

    return createHmac('sha512', hashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex')
  }

  private sortParams(params: Record<string, string>): Record<string, string> {
    return Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = String(params[key])
        return acc
      }, {})
  }

  private normalizeParams(query: VnpayQuery): Record<string, string> {
    return Object.keys(query).reduce<Record<string, string>>((acc, key) => {
      const value = Array.isArray(query[key]) ? query[key][0] : query[key]
      if (value !== undefined && value !== null) {
        acc[key] = String(value)
      }
      return acc
    }, {})
  }

  private buildQueryString(params: Record<string, string>): string {
    return Object.keys(params)
      .map((key) => `${this.vnpayEncode(key)}=${this.vnpayEncode(params[key])}`)
      .join('&')
  }

  private vnpayEncode(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+')
  }

  private formatVnpayDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0')
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join('')
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key)
    if (!value?.trim()) {
      throw new InternalServerErrorException(`Missing environment variable: ${key}`)
    }
    return value.trim()
  }
}

import { createHmac, timingSafeEqual } from 'crypto'
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import axios from 'axios'
import type {
  SepayBankAccount,
  SepayQrInput,
  SepayService as SepayServicePort,
  ListSepayV2TransactionsInput,
  SepayV2Transaction,
  SepayV2TransactionsPage,
  SepayWebhookHeaders,
} from 'src/application/interfaces/sepay.interface'
import { SepayConfig } from 'src/config/sepay.config'
import { SepayTransactionTransferType } from 'src/shared/enums'

@Injectable()
export class SepayService implements SepayServicePort {
  constructor(
    @Inject(SepayConfig.KEY)
    private readonly config: ConfigType<typeof SepayConfig>,
  ) {}

  verifyWebhook(rawBody: Buffer, headers: SepayWebhookHeaders): void {
    const timestamp = headers.timestamp?.trim()
    const signature = headers.signature?.trim()
    const secret = this.requireSecret()

    if (!timestamp || !signature || !/^\d+$/.test(timestamp)) {
      throw new BadRequestException('Webhook SePay thiếu chữ ký hoặc thời gian')
    }

    if (Math.abs(Date.now() - Number(timestamp) * 1000) > 5 * 60 * 1000) {
      throw new BadRequestException('Webhook SePay đã hết hạn')
    }

    const expected = `sha256=${createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex')}`
    const expectedBuffer = Buffer.from(expected)
    const receivedBuffer = Buffer.from(signature)
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      throw new BadRequestException('Chữ ký webhook SePay không hợp lệ')
    }
  }

  createVietQrUrl(input: SepayQrInput): string {
    const params = new URLSearchParams({
      acc: input.accountNumber,
      bank: input.bankCode,
      amount: String(input.amount),
      des: input.description,
    })
    return `${this.config.qrBaseUrl}/img?${params.toString()}`
  }

  getAttemptExpiry(): Date {
    const minutes = Number.isFinite(this.config.attemptExpiryMinutes) && this.config.attemptExpiryMinutes > 0
      ? this.config.attemptExpiryMinutes
      : 30
    return new Date(Date.now() + minutes * 60 * 1000)
  }

  async listBankAccounts(): Promise<SepayBankAccount[]> {
    const response = await this.get<unknown>('/bankaccounts/list', { limit: 100 })
    const payload = this.requireRecord(response)
    if (!Array.isArray(payload.bankaccounts)) {
      throw new BadGatewayException('SePay trả về danh sách tài khoản không hợp lệ')
    }

    return payload.bankaccounts.map((bankAccount) => this.toBankAccount(bankAccount))
  }

  async getBankAccount(sepayBankAccountId: string): Promise<SepayBankAccount> {
    const response = await this.get<unknown>(
      `/bankaccounts/details/${encodeURIComponent(sepayBankAccountId)}`,
    )

    return this.toBankAccount(this.requireRecord(response).bankaccount)
  }

  async listV2Transactions(input: ListSepayV2TransactionsInput): Promise<SepayV2TransactionsPage> {
    const response = await this.getV2<unknown>('/transactions', {
      ...(input.sinceId ? { since_id: input.sinceId } : {}),
      ...(input.page ? { page: input.page } : {}),
      per_page: input.perPage,
      ...(input.transferType ? { transfer_type: input.transferType } : {}),
      timestamp_format: 'iso8601',
    })
    const payload = this.requireRecord(response)
    if (!Array.isArray(payload.data)) {
      throw new BadGatewayException('SePay trả về danh sách giao dịch không hợp lệ')
    }

    const pagination = this.requireRecord(this.requireRecord(payload.meta).pagination)
    if (typeof pagination.has_more !== 'boolean') {
      throw new BadGatewayException('SePay trả về phân trang giao dịch không hợp lệ')
    }

    return {
      transactions: payload.data.map((transaction) => this.toV2Transaction(transaction)),
      hasMore: pagination.has_more,
    }
  }

  private async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    try {
      const response = await axios.get<T>(`${this.config.apiBaseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${this.requireApiKey()}`,
          'Content-Type': 'application/json',
        },
        params,
        timeout: this.getApiTimeoutMs(),
      })

      return response.data
    } catch (error) {
      if (error instanceof BadGatewayException || error instanceof InternalServerErrorException) {
        throw error
      }

      throw new BadGatewayException('Không thể lấy dữ liệu tài khoản từ SePay')
    }
  }

  private async getV2<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    try {
      const response = await axios.get<T>(`${this.config.v2ApiBaseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${this.requireApiKey()}`,
          'Content-Type': 'application/json',
        },
        params,
        timeout: this.getApiTimeoutMs(),
      })
      return response.data
    } catch (error) {
      if (error instanceof BadGatewayException || error instanceof InternalServerErrorException) {
        throw error
      }
      throw new BadGatewayException('Không thể lấy dữ liệu giao dịch từ SePay')
    }
  }

  private toBankAccount(value: unknown): SepayBankAccount {
    const account = this.requireRecord(value)
    const active = this.requireString(account.active)
    if (active !== '0' && active !== '1') {
      throw new BadGatewayException('SePay trả về trạng thái tài khoản không hợp lệ')
    }

    return {
      sepayBankAccountId: this.requireString(account.id),
      bankCode: this.requireString(account.bank_code),
      accountNumber: this.requireString(account.account_number),
      accountHolder: this.requireString(account.account_holder_name),
      balance: this.requireString(account.accumulated),
      isActive: active === '1',
      lastTransactionAt: typeof account.last_transaction === 'string' ? account.last_transaction : null,
    }
  }

  private toV2Transaction(value: unknown): SepayV2Transaction {
    const transaction = this.requireRecord(value)
    const transferType = this.requireString(transaction.transfer_type)
    if (
      transferType !== SepayTransactionTransferType.IN &&
      transferType !== SepayTransactionTransferType.OUT
    ) {
      throw new BadGatewayException('SePay trả về hướng giao dịch không hợp lệ')
    }

    return {
      sepayV2TransactionId: this.requireString(transaction.id),
      transactionDate: this.requireString(transaction.transaction_date),
      accountNumber: this.requireString(transaction.account_number),
      transferType,
      amountIn: this.requireInteger(transaction.amount_in),
      amountOut: this.requireInteger(transaction.amount_out),
      transactionContent: this.optionalString(transaction.transaction_content),
      referenceNumber: this.optionalString(transaction.reference_number),
      code: this.optionalString(transaction.code),
      bankAccountId: this.optionalString(transaction.bank_account_id),
      rawPayload: transaction,
    }
  }

  private requireRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadGatewayException('SePay trả về dữ liệu không hợp lệ')
    }

    return value as Record<string, unknown>
  }

  private requireString(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadGatewayException('SePay trả về dữ liệu tài khoản không đầy đủ')
    }

    return value.trim()
  }

  private optionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }

  private requireInteger(value: unknown): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
      throw new BadGatewayException('SePay trả về số tiền giao dịch không hợp lệ')
    }
    return value
  }

  private getApiTimeoutMs(): number {
    return Number.isFinite(this.config.apiTimeoutMs) && this.config.apiTimeoutMs > 0
      ? this.config.apiTimeoutMs
      : 15_000
  }

  private requireApiKey(): string {
    if (!this.config.apiKey) {
      throw new InternalServerErrorException('Thiếu cấu hình API SePay')
    }

    return this.config.apiKey
  }

  private requireSecret(): string {
    if (!this.config.webhookSecret) {
      throw new InternalServerErrorException('Thiếu cấu hình SePay')
    }
    return this.config.webhookSecret
  }
}

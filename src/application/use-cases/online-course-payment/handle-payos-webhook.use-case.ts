import { Inject, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PayosService } from 'src/application/interfaces'
import type { PayosWebhookEvent } from 'src/application/interfaces'
import type { PayosWebhookResponseDto } from 'src/application/dtos/online-course-payment'
import type { IUnitOfWork } from 'src/domain/repositories'
import { OnlineCourseInvoiceStatus, OnlinePaymentAttemptStatus, OnlinePaymentProvider } from 'src/shared/enums'
import { createEnrollmentsForPaidOnlineCourseInvoice } from './online-course-invoice-enrollment.helper'

@Injectable()
export class HandlePayosWebhookUseCase {
  private readonly logger = new Logger(HandlePayosWebhookUseCase.name)

  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly payosService: PayosService,
  ) {}

  async execute(payload: unknown): Promise<PayosWebhookResponseDto> {
    this.log('received', this.getPayloadSummary(payload))

    let webhook: PayosWebhookEvent
    try {
      webhook = this.payosService.verifyWebhook(payload)
    } catch (error) {
      this.logger.warn(
        `[PayOS webhook] signature_or_payload_rejected ${JSON.stringify({
          ...this.getPayloadSummary(payload),
          reason: error instanceof Error ? error.message : 'Unknown verification error',
        })}`,
      )
      throw error
    }

    this.log('signature_verified', {
      orderCode: webhook.data.orderCode,
      amount: webhook.data.amount,
      webhookCode: webhook.code,
      paymentCode: webhook.data.code ?? null,
      paymentLinkId: webhook.data.paymentLinkId ?? null,
    })

    const providerOrderId = String(webhook.data.orderCode)
    this.log('payment_attempt_lookup_started', { providerOrderId })
    const attempt = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCoursePaymentAttemptRepository.findByProviderOrder(OnlinePaymentProvider.PAYOS, providerOrderId),
    )

    if (!attempt) {
      this.logger.warn(`[PayOS webhook] payment_attempt_not_found ${JSON.stringify({ providerOrderId })}`)
      return this.response('00', 'Ignored')
    }
    this.log('payment_attempt_found', {
      attemptId: attempt.attemptId,
      invoiceId: attempt.invoiceId,
      attemptStatus: attempt.status,
      amount: attempt.amount,
    })

    if (webhook.data.amount !== attempt.amount) {
      this.logger.warn(
        `[PayOS webhook] amount_mismatch ${JSON.stringify({
          attemptId: attempt.attemptId,
          expectedAmount: attempt.amount,
          receivedAmount: webhook.data.amount,
        })}`,
      )
      return this.response('00', 'Ignored')
    }

    this.log('invoice_lookup_started', { invoiceId: attempt.invoiceId })
    const invoice = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCourseInvoiceRepository.findById(attempt.invoiceId),
    )
    if (!invoice) {
      this.logger.warn(
        `[PayOS webhook] invoice_not_found ${JSON.stringify({ attemptId: attempt.attemptId, invoiceId: attempt.invoiceId })}`,
      )
      return this.response('00', 'Ignored')
    }
    this.log('invoice_found', { invoiceId: invoice.invoiceId, invoiceStatus: invoice.status })

    if (attempt.status === OnlinePaymentAttemptStatus.SUCCEEDED || invoice.status === OnlineCourseInvoiceStatus.PAID) {
      this.log('already_processed', { attemptId: attempt.attemptId, invoiceId: invoice.invoiceId })
      return this.response('00', 'OK')
    }

    if (!webhook.success || webhook.code !== '00' || webhook.data.code !== '00') {
      this.logger.warn(
        `[PayOS webhook] payment_failed_by_provider ${JSON.stringify({
          attemptId: attempt.attemptId,
          invoiceId: invoice.invoiceId,
          webhookCode: webhook.code,
          paymentCode: webhook.data.code ?? null,
        })}`,
      )
      await this.unitOfWork.executeInTransaction(async (repos) => {
        await repos.onlineCoursePaymentAttemptRepository.update(attempt.attemptId, {
          status: OnlinePaymentAttemptStatus.FAILED,
          providerResponseCode: webhook.data.code || webhook.code,
          providerMessage: webhook.data.desc || webhook.desc,
          callbackPayload: payload,
          failedAt: new Date(),
        })
        await repos.onlineCourseInvoiceRepository.update(invoice.invoiceId, {
          status: OnlineCourseInvoiceStatus.PAYMENT_FAILED,
          notes: webhook.data.desc || webhook.desc || 'PayOS payment failed',
        })
      })

      this.log('failure_state_persisted', { attemptId: attempt.attemptId, invoiceId: invoice.invoiceId })
      return this.response('00', 'OK')
    }

    const providerPayDate = this.normalizeProviderPayDate(webhook.data.transactionDateTime)
    if (webhook.data.transactionDateTime && !providerPayDate) {
      this.logger.warn(
        `[PayOS webhook] provider_pay_date_ignored ${JSON.stringify({
          orderCode: webhook.data.orderCode,
          sourceLength: webhook.data.transactionDateTime.length,
        })}`,
      )
    }

    try {
      await this.unitOfWork.executeInTransaction(
        async (repos) => {
          this.log('success_transaction_started', { attemptId: attempt.attemptId, invoiceId: invoice.invoiceId })
          const currentAttempt = await repos.onlineCoursePaymentAttemptRepository.findById(attempt.attemptId)
          const currentInvoice = await repos.onlineCourseInvoiceRepository.findById(invoice.invoiceId)
          if (!currentAttempt || !currentInvoice) {
            this.logger.warn(
              `[PayOS webhook] state_missing_in_transaction ${JSON.stringify({
                attemptId: attempt.attemptId,
                invoiceId: invoice.invoiceId,
              })}`,
            )
            return
          }
          if (
            currentAttempt.status === OnlinePaymentAttemptStatus.SUCCEEDED ||
            currentInvoice.status === OnlineCourseInvoiceStatus.PAID
          ) {
            this.log('already_processed_in_transaction', {
              attemptId: currentAttempt.attemptId,
              invoiceId: currentInvoice.invoiceId,
            })
            return
          }

          await repos.onlineCoursePaymentAttemptRepository.update(currentAttempt.attemptId, {
            status: OnlinePaymentAttemptStatus.SUCCEEDED,
            providerTransactionId: webhook.data.reference,
            providerResponseCode: webhook.data.code || webhook.code,
            providerMessage: webhook.data.desc || webhook.desc,
            providerBankCode: webhook.data.counterAccountBankId,
            providerBankTranNo: webhook.data.reference,
            providerPayDate,
            callbackPayload: payload,
            paidAt: new Date(),
          })
          this.log('payment_attempt_marked_succeeded', {
            attemptId: currentAttempt.attemptId,
            invoiceId: currentInvoice.invoiceId,
          })
          await repos.onlineCourseInvoiceRepository.update(currentInvoice.invoiceId, {
            status: OnlineCourseInvoiceStatus.PAID,
            paidAmount: currentAttempt.amount,
            paidAt: new Date(),
            paymentProvider: OnlinePaymentProvider.PAYOS,
            providerOrderId: currentAttempt.providerOrderId,
          })
          this.log('invoice_marked_paid', { invoiceId: currentInvoice.invoiceId, amount: currentAttempt.amount })
          await createEnrollmentsForPaidOnlineCourseInvoice(repos, currentInvoice)
          this.log('enrollments_created_or_activated', { invoiceId: currentInvoice.invoiceId })
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
    } catch (error) {
      this.logger.error(
        `[PayOS webhook] success_transaction_failed ${JSON.stringify({
          attemptId: attempt.attemptId,
          invoiceId: invoice.invoiceId,
          reason: error instanceof Error ? error.message : 'Unknown transaction error',
        })}`,
      )
      throw error
    }

    this.log('completed', { attemptId: attempt.attemptId, invoiceId: invoice.invoiceId })
    return this.response('00', 'OK')
  }

  private response(code: string, desc: string): PayosWebhookResponseDto {
    return { code, desc }
  }

  /** The shared provider_pay_date column stores payment dates as yyyyMMddHHmmss (14 characters). */
  private normalizeProviderPayDate(transactionDateTime?: string): string | undefined {
    if (!transactionDateTime) return undefined

    const digits = transactionDateTime.replace(/\D/g, '')
    return digits.length >= 14 ? digits.slice(0, 14) : undefined
  }

  private log(event: string, context: Record<string, unknown>): void {
    this.logger.log(`[PayOS webhook] ${event} ${JSON.stringify(context)}`)
  }

  private getPayloadSummary(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') return { payloadType: typeof payload }

    const webhook = payload as Record<string, unknown>
    const data = webhook.data && typeof webhook.data === 'object' ? (webhook.data as Record<string, unknown>) : {}

    return {
      payloadType: 'object',
      webhookCode: webhook.code ?? null,
      success: webhook.success ?? null,
      hasSignature: typeof webhook.signature === 'string',
      signatureLength: typeof webhook.signature === 'string' ? webhook.signature.length : 0,
      orderCode: data.orderCode ?? null,
      amount: data.amount ?? null,
      paymentCode: data.code ?? null,
      paymentLinkId: data.paymentLinkId ?? null,
      hasReference: typeof data.reference === 'string' && data.reference.length > 0,
    }
  }
}

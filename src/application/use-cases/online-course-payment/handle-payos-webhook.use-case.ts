import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PayosService } from 'src/application/interfaces'
import type { PayosWebhookResponseDto } from 'src/application/dtos/online-course-payment'
import type { IUnitOfWork } from 'src/domain/repositories'
import { OnlineCourseInvoiceStatus, OnlinePaymentAttemptStatus, OnlinePaymentProvider } from 'src/shared/enums'
import { createEnrollmentsForPaidOnlineCourseInvoice } from './online-course-invoice-enrollment.helper'

@Injectable()
export class HandlePayosWebhookUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly payosService: PayosService,
  ) {}

  async execute(payload: unknown): Promise<PayosWebhookResponseDto> {
    const webhook = this.payosService.verifyWebhook(payload)
    const providerOrderId = String(webhook.data.orderCode)
    const attempt = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCoursePaymentAttemptRepository.findByProviderOrder(OnlinePaymentProvider.PAYOS, providerOrderId),
    )

    if (!attempt) return this.response('00', 'Ignored')
    if (webhook.data.amount !== attempt.amount) return this.response('00', 'Ignored')

    const invoice = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCourseInvoiceRepository.findById(attempt.invoiceId),
    )
    if (!invoice) return this.response('00', 'Ignored')

    if (attempt.status === OnlinePaymentAttemptStatus.SUCCEEDED || invoice.status === OnlineCourseInvoiceStatus.PAID) {
      return this.response('00', 'OK')
    }

    if (!webhook.success || webhook.code !== '00' || webhook.data.code !== '00') {
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

      return this.response('00', 'OK')
    }

    await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const currentAttempt = await repos.onlineCoursePaymentAttemptRepository.findById(attempt.attemptId)
        const currentInvoice = await repos.onlineCourseInvoiceRepository.findById(invoice.invoiceId)
        if (!currentAttempt || !currentInvoice) return
        if (
          currentAttempt.status === OnlinePaymentAttemptStatus.SUCCEEDED ||
          currentInvoice.status === OnlineCourseInvoiceStatus.PAID
        ) {
          return
        }

        await repos.onlineCoursePaymentAttemptRepository.update(currentAttempt.attemptId, {
          status: OnlinePaymentAttemptStatus.SUCCEEDED,
          providerTransactionId: webhook.data.reference,
          providerResponseCode: webhook.data.code || webhook.code,
          providerMessage: webhook.data.desc || webhook.desc,
          providerBankCode: webhook.data.counterAccountBankId,
          providerBankTranNo: webhook.data.reference,
          providerPayDate: webhook.data.transactionDateTime,
          callbackPayload: payload,
          paidAt: new Date(),
        })
        await repos.onlineCourseInvoiceRepository.update(currentInvoice.invoiceId, {
          status: OnlineCourseInvoiceStatus.PAID,
          paidAmount: currentAttempt.amount,
          paidAt: new Date(),
          paymentProvider: OnlinePaymentProvider.PAYOS,
          providerOrderId: currentAttempt.providerOrderId,
        })
        await createEnrollmentsForPaidOnlineCourseInvoice(repos, currentInvoice)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return this.response('00', 'OK')
  }

  private response(code: string, desc: string): PayosWebhookResponseDto {
    return { code, desc }
  }
}

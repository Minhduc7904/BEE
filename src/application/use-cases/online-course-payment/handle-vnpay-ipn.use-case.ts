import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { IUnitOfWork } from 'src/domain/repositories'
import { VnpayService } from 'src/application/interfaces'
import {
  OnlineCourseInvoiceStatus,
  OnlinePaymentAttemptStatus,
  OnlinePaymentProvider,
} from 'src/shared/enums'
import type { VnpayIpnResponseDto } from 'src/application/dtos/online-course-payment'
import { createEnrollmentsForPaidOnlineCourseInvoice } from './online-course-invoice-enrollment.helper'

@Injectable()
export class HandleVnpayIpnUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly vnpayService: VnpayService,
  ) {}

  async execute(query: Record<string, any>): Promise<VnpayIpnResponseDto> {
    const verify = this.vnpayService.verifyIpn(query)
    if (!verify.isVerified) {
      return this.response('97', 'Checksum failed')
    }

    if (!verify.txnRef) {
      return this.response('01', 'Order not found')
    }

    const attempt = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCoursePaymentAttemptRepository.findByProviderOrder(
        OnlinePaymentProvider.VNPAY,
        verify.txnRef!,
      ),
    )

    if (!attempt) {
      return this.response('01', 'Order not found')
    }

    const invoice = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCourseInvoiceRepository.findById(attempt.invoiceId),
    )

    if (!invoice) {
      return this.response('01', 'Order not found')
    }

    if (verify.amount === undefined || verify.amount !== attempt.amount) {
      return this.response('04', 'Invalid amount')
    }

    if (attempt.status === OnlinePaymentAttemptStatus.SUCCEEDED || invoice.status === OnlineCourseInvoiceStatus.PAID) {
      return this.response('02', 'Order already confirmed')
    }

    if (!verify.isSuccess) {
      await this.unitOfWork.executeInTransaction(async (repos) => {
        await repos.onlineCoursePaymentAttemptRepository.update(attempt.attemptId, {
          status: OnlinePaymentAttemptStatus.FAILED,
          providerTransactionId: verify.transactionNo,
          providerResponseCode: verify.responseCode,
          providerMessage: verify.message,
          providerBankCode: verify.bankCode,
          providerBankTranNo: verify.bankTranNo,
          providerCardType: verify.cardType,
          providerPayDate: verify.payDate,
          callbackPayload: query,
          failedAt: new Date(),
        })
        await repos.onlineCourseInvoiceRepository.update(invoice.invoiceId, {
          status: OnlineCourseInvoiceStatus.PAYMENT_FAILED,
          notes: verify.message || verify.responseCode || 'VNPay payment failed',
        })
      })

      return this.response('00', 'Confirm Success')
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
          providerTransactionId: verify.transactionNo,
          providerResponseCode: verify.responseCode,
          providerMessage: verify.message,
          providerBankCode: verify.bankCode,
          providerBankTranNo: verify.bankTranNo,
          providerCardType: verify.cardType,
          providerPayDate: verify.payDate,
          callbackPayload: query,
          paidAt: new Date(),
        })

        await repos.onlineCourseInvoiceRepository.update(currentInvoice.invoiceId, {
          status: OnlineCourseInvoiceStatus.PAID,
          paidAmount: currentAttempt.amount,
          paidAt: new Date(),
          paymentProvider: OnlinePaymentProvider.VNPAY,
          providerOrderId: currentAttempt.providerOrderId,
        })

        await createEnrollmentsForPaidOnlineCourseInvoice(repos, currentInvoice)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return this.response('00', 'Confirm Success')
  }

  private response(RspCode: string, Message: string): VnpayIpnResponseDto {
    return { RspCode, Message }
  }
}

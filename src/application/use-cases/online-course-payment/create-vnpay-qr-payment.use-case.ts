import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { VnpayService } from 'src/infrastructure/services'
import {
  OnlineCourseInvoiceStatus,
  OnlinePaymentAttemptStatus,
  OnlinePaymentProvider,
} from 'src/shared/enums'
import type { VnpayQrPaymentResponseDto } from 'src/application/dtos/online-course-payment'

@Injectable()
export class CreateVnpayQrPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly vnpayService: VnpayService,
  ) {}

  async execute(invoiceId: number, buyerUserId: number, ipAddr?: string): Promise<VnpayQrPaymentResponseDto> {
    const invoice = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCourseInvoiceRepository.findById(invoiceId),
    )

    if (!invoice || invoice.buyerUserId !== buyerUserId) {
      throw new NotFoundException('Khong tim thay hoa don')
    }

    if (invoice.status !== OnlineCourseInvoiceStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Hoa don khong o trang thai cho thanh toan')
    }

    if (invoice.totalAmount <= 0) {
      throw new BadRequestException('So tien hoa don khong hop le')
    }

    const validItems = invoice.items?.filter((item) => item.courseId) ?? []
    if (!validItems.length) {
      throw new BadRequestException('Hoa don khong co khoa hoc hop le')
    }

    const now = new Date()
    const expiredAt = new Date(now.getTime() + 15 * 60 * 1000)
    const attemptCode = `VNPAY_${invoice.invoiceId}_${Date.now()}`
    const payment = this.vnpayService.createPaymentUrl({
      txnRef: attemptCode,
      amount: invoice.totalAmount,
      orderInfo: `Thanh toan hoa don ${invoice.invoiceCode}`,
      ipAddr,
      createDate: now,
      expireDate: expiredAt,
    })

    return this.unitOfWork.executeInTransaction(async (repos) => {
      const latestInvoice = await repos.onlineCourseInvoiceRepository.findById(invoiceId)
      if (!latestInvoice || latestInvoice.buyerUserId !== buyerUserId) {
        throw new NotFoundException('Khong tim thay hoa don')
      }
      if (latestInvoice.status !== OnlineCourseInvoiceStatus.PENDING_PAYMENT) {
        throw new BadRequestException('Hoa don khong o trang thai cho thanh toan')
      }

      const attempt = await repos.onlineCoursePaymentAttemptRepository.create({
        invoiceId: latestInvoice.invoiceId,
        attemptCode,
        provider: OnlinePaymentProvider.VNPAY,
        status: OnlinePaymentAttemptStatus.PENDING,
        amount: latestInvoice.totalAmount,
        currency: latestInvoice.currency,
        providerOrderId: attemptCode,
        checkoutUrl: payment.paymentUrl,
        expiredAt,
        requestPayload: payment.requestPayload,
        responsePayload: {
          paymentUrl: payment.paymentUrl,
          qrContent: null,
        },
      })

      await repos.onlineCourseInvoiceRepository.update(latestInvoice.invoiceId, {
        paymentProvider: OnlinePaymentProvider.VNPAY,
        providerOrderId: attemptCode,
        checkoutUrl: payment.paymentUrl,
        expiresAt: expiredAt,
        metadata: {
          ...(latestInvoice.metadata ?? {}),
          latestVnpayAttemptCode: attemptCode,
        },
      })

      return {
        invoiceId: latestInvoice.invoiceId,
        invoiceCode: latestInvoice.invoiceCode,
        attemptId: attempt.attemptId,
        attemptCode: attempt.attemptCode,
        amount: attempt.amount,
        currency: attempt.currency,
        qrContent: attempt.qrContent ?? null,
        paymentUrl: payment.paymentUrl,
        expiresAt: expiredAt,
        status: attempt.status,
      }
    })
  }
}

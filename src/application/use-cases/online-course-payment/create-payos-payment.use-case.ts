import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PayosService } from 'src/application/interfaces'
import type { PayosPaymentResponseDto } from 'src/application/dtos/online-course-payment'
import type { IUnitOfWork } from 'src/domain/repositories'
import { OnlineCourseInvoiceStatus, OnlinePaymentAttemptStatus, OnlinePaymentProvider } from 'src/shared/enums'

@Injectable()
export class CreatePayosPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly payosService: PayosService,
  ) {}

  async execute(invoiceId: number, buyerUserId: number): Promise<PayosPaymentResponseDto> {
    const invoice = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCourseInvoiceRepository.findById(invoiceId),
    )

    if (!invoice || invoice.buyerUserId !== buyerUserId) {
      throw new NotFoundException('Khong tim thay hoa don')
    }
    if (invoice.status !== OnlineCourseInvoiceStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Hoa don khong o trang thai cho thanh toan')
    }
    if (!Number.isInteger(invoice.totalAmount) || invoice.totalAmount <= 0) {
      throw new BadRequestException('So tien hoa don khong hop le')
    }

    const validItems = invoice.items?.filter((item) => item.courseId) ?? []
    if (!validItems.length) {
      throw new BadRequestException('Hoa don khong co khoa hoc hop le')
    }

    const now = new Date()
    const expiredAt = new Date(now.getTime() + 15 * 60 * 1000)
    const orderCode = Date.now()
    const attemptCode = `PAYOS_${invoice.invoiceId}_${orderCode}`
    const payment = await this.payosService.createPaymentLink({
      orderCode,
      amount: invoice.totalAmount,
      description: `TTDH${orderCode}`,
      items: validItems.map((item) => ({
        name: item.courseTitle,
        quantity: item.quantity,
        price: item.unitPriceAmount,
      })),
      expiredAt: Math.floor(expiredAt.getTime() / 1000),
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
        provider: OnlinePaymentProvider.PAYOS,
        status: OnlinePaymentAttemptStatus.PENDING,
        amount: latestInvoice.totalAmount,
        currency: latestInvoice.currency,
        providerOrderId: String(orderCode),
        checkoutUrl: payment.checkoutUrl,
        qrContent: payment.qrCode,
        expiredAt,
        requestPayload: { orderCode, amount: latestInvoice.totalAmount },
        responsePayload: payment,
      })

      await repos.onlineCourseInvoiceRepository.update(latestInvoice.invoiceId, {
        paymentProvider: OnlinePaymentProvider.PAYOS,
        providerOrderId: String(orderCode),
        checkoutUrl: payment.checkoutUrl,
        expiresAt: expiredAt,
        metadata: {
          ...(latestInvoice.metadata ?? {}),
          latestPayosAttemptCode: attemptCode,
        },
      })

      return {
        invoiceId: latestInvoice.invoiceId,
        invoiceCode: latestInvoice.invoiceCode,
        attemptId: attempt.attemptId,
        attemptCode: attempt.attemptCode,
        orderCode,
        paymentLinkId: payment.paymentLinkId,
        amount: attempt.amount,
        currency: attempt.currency,
        qrContent: payment.qrCode,
        paymentUrl: payment.checkoutUrl,
        expiresAt: expiredAt,
        status: attempt.status,
      }
    })
  }
}

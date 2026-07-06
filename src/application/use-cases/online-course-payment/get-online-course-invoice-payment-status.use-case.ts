import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { OnlineCourseInvoiceStatus } from 'src/shared/enums'
import type { OnlineCourseInvoicePaymentStatusResponseDto } from 'src/application/dtos/online-course-payment'

@Injectable()
export class GetOnlineCourseInvoicePaymentStatusUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(invoiceId: number, buyerUserId: number): Promise<OnlineCourseInvoicePaymentStatusResponseDto> {
    const invoice = await this.unitOfWork.executeInTransaction((repos) =>
      repos.onlineCourseInvoiceRepository.findById(invoiceId),
    )

    if (!invoice || invoice.buyerUserId !== buyerUserId) {
      throw new NotFoundException('Khong tim thay hoa don')
    }

    const latestAttempt = [...(invoice.paymentAttempts ?? [])].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0]

    const payableItems = invoice.items?.filter((item) => item.courseId) ?? []
    const enrollmentCreated =
      invoice.status === OnlineCourseInvoiceStatus.PAID &&
      payableItems.length > 0 &&
      payableItems.every((item) => Boolean(item.enrollmentId))

    return {
      invoiceId: invoice.invoiceId,
      invoiceCode: invoice.invoiceCode,
      status: invoice.status,
      paidAt: invoice.paidAt ?? null,
      paidAmount: invoice.paidAmount,
      latestAttempt: latestAttempt
        ? {
            attemptCode: latestAttempt.attemptCode,
            status: latestAttempt.status,
            provider: latestAttempt.provider,
          }
        : null,
      enrollmentCreated,
    }
  }
}

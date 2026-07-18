import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import type { IUnitOfWork } from 'src/domain/repositories'
import { OnlineCourseInvoiceStatus, OnlinePaymentAttemptStatus } from 'src/shared/enums'

@Injectable()
export class DeleteOnlineCourseInvoiceUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(invoiceId: number): Promise<BaseResponseDto<null>> {
    await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const invoice = await repos.onlineCourseInvoiceRepository.findById(invoiceId)
        if (!invoice) {
          throw new NotFoundException('Khong tim thay hoa don mua khoa hoc online')
        }

        const hasEnrollment = invoice.items?.some((item) => item.enrollmentId) ?? false
        const hasSucceededAttempt =
          invoice.paymentAttempts?.some((attempt) => attempt.status === OnlinePaymentAttemptStatus.SUCCEEDED) ?? false
        if (
          invoice.status === OnlineCourseInvoiceStatus.PAID ||
          invoice.paidAmount > 0 ||
          hasEnrollment ||
          hasSucceededAttempt
        ) {
          throw new BadRequestException('Khong the xoa hoa don da thanh toan hoac da kich hoat khoa hoc')
        }

        const hasActiveAttempt =
          invoice.paymentAttempts?.some((attempt) =>
            [OnlinePaymentAttemptStatus.PENDING, OnlinePaymentAttemptStatus.PROCESSING].includes(attempt.status),
          ) ?? false
        if (hasActiveAttempt) {
          throw new BadRequestException('Khong the xoa hoa don dang co yeu cau thanh toan hoat dong')
        }

        await repos.onlineCourseInvoiceRepository.delete(invoice.invoiceId)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Xoa hoa don mua khoa hoc online thanh cong', null)
  }
}

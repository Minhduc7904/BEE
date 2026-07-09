import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  ConfirmManualBankTransferPaymentDto,
  ConfirmManualBankTransferPaymentResponseDto,
} from 'src/application/dtos/online-course-payment'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import type { OnlineCourseInvoice } from 'src/domain/entities/online-course-payment'
import type { IUnitOfWork } from 'src/domain/repositories'
import {
  OnlineCourseInvoiceStatus,
  OnlinePaymentAttemptStatus,
  OnlinePaymentProvider,
} from 'src/shared/enums'
import {
  toAdminOnlineCourseInvoiceResponse,
  toAdminOnlineCoursePaymentAttemptResponse,
} from './admin-online-course-invoice-response.mapper'
import { createEnrollmentsForPaidOnlineCourseInvoice } from './online-course-invoice-enrollment.helper'

@Injectable()
export class ConfirmManualBankTransferPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    invoiceId: number,
    dto: ConfirmManualBankTransferPaymentDto,
    adminUserId?: number,
  ): Promise<BaseResponseDto<ConfirmManualBankTransferPaymentResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const invoice = await repos.onlineCourseInvoiceRepository.findById(invoiceId)
        if (!invoice) {
          throw new NotFoundException('Khong tim thay hoa don mua khoa hoc online')
        }

        const payableItems = invoice.items?.filter((item) => item.courseId) ?? []
        if (payableItems.length === 0) {
          throw new BadRequestException('Hoa don khong co khoa hoc hop le de kich hoat')
        }

        if (invoice.totalAmount <= 0) {
          throw new BadRequestException('Tong tien hoa don phai lon hon 0')
        }

        if (invoice.status === OnlineCourseInvoiceStatus.PAID) {
          await createEnrollmentsForPaidOnlineCourseInvoice(repos, invoice)
          const paidInvoice = await repos.onlineCourseInvoiceRepository.findById(invoice.invoiceId)
          const responseInvoice = toAdminOnlineCourseInvoiceResponse(paidInvoice ?? invoice)

          return {
            invoice: responseInvoice,
            attempt: responseInvoice.latestAttempt ?? null,
            alreadyPaid: true,
            enrollmentCreated: responseInvoice.enrollmentCreated,
          }
        }

        if (!invoice.canBeMarkedPaid()) {
          throw new BadRequestException(`Khong the xac nhan thanh toan cho hoa don co trang thai ${invoice.status}`)
        }

        const paidAmount = dto.paidAmount ?? invoice.totalAmount
        if (paidAmount !== invoice.totalAmount) {
          throw new BadRequestException('So tien da thanh toan phai bang tong tien hoa don de mo khoa khoa hoc')
        }

        const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date()
        const attemptCode = `BANK_${invoice.invoiceId}_${Date.now()}`
        const manualPayload = {
          invoiceId: invoice.invoiceId,
          invoiceCode: invoice.invoiceCode,
          bankCode: dto.bankCode,
          bankTranNo: dto.bankTranNo,
          transactionId: dto.transactionId,
          note: dto.note,
          metadata: dto.metadata,
          confirmedBy: adminUserId,
          confirmedAt: new Date().toISOString(),
        }

        const attempt = await repos.onlineCoursePaymentAttemptRepository.create({
          invoiceId: invoice.invoiceId,
          attemptCode,
          provider: OnlinePaymentProvider.BANK_TRANSFER,
          status: OnlinePaymentAttemptStatus.SUCCEEDED,
          amount: paidAmount,
          currency: invoice.currency,
          providerOrderId: attemptCode,
          providerTransactionId: dto.transactionId || dto.bankTranNo || attemptCode,
          providerResponseCode: 'MANUAL_CONFIRMED',
          providerMessage: dto.note || 'Manual bank transfer confirmed by admin',
          providerBankCode: dto.bankCode,
          providerBankTranNo: dto.bankTranNo,
          requestPayload: manualPayload,
          callbackPayload: manualPayload,
          paidAt,
        })

        await repos.onlineCourseInvoiceRepository.update(invoice.invoiceId, {
          status: OnlineCourseInvoiceStatus.PAID,
          paidAmount,
          paidAt,
          paymentProvider: OnlinePaymentProvider.BANK_TRANSFER,
          providerOrderId: attempt.providerOrderId,
          notes: dto.note ?? invoice.notes,
          metadata: this.buildManualPaymentMetadata(invoice, dto, attemptCode, adminUserId),
        })

        await createEnrollmentsForPaidOnlineCourseInvoice(repos, invoice)

        const paidInvoice = await repos.onlineCourseInvoiceRepository.findById(invoice.invoiceId)
        const responseInvoice = toAdminOnlineCourseInvoiceResponse(paidInvoice ?? invoice)

        return {
          invoice: responseInvoice,
          attempt: toAdminOnlineCoursePaymentAttemptResponse(attempt),
          alreadyPaid: false,
          enrollmentCreated: responseInvoice.enrollmentCreated,
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Xac nhan chuyen khoan va kich hoat khoa hoc thanh cong', result)
  }

  private buildManualPaymentMetadata(
    invoice: OnlineCourseInvoice,
    dto: ConfirmManualBankTransferPaymentDto,
    attemptCode: string,
    adminUserId?: number,
  ): Record<string, any> {
    const existingMetadata =
      invoice.metadata && typeof invoice.metadata === 'object' && !Array.isArray(invoice.metadata)
        ? invoice.metadata
        : {}

    return {
      ...existingMetadata,
      manualPayment: {
        provider: OnlinePaymentProvider.BANK_TRANSFER,
        attemptCode,
        bankCode: dto.bankCode ?? null,
        bankTranNo: dto.bankTranNo ?? null,
        transactionId: dto.transactionId ?? null,
        note: dto.note ?? null,
        metadata: dto.metadata ?? null,
        confirmedBy: adminUserId ?? null,
        confirmedAt: new Date().toISOString(),
      },
    }
  }
}

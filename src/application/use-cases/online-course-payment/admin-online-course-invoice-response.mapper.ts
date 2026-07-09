import type {
  AdminOnlineCourseInvoiceResponseDto,
  AdminOnlineCoursePaymentAttemptResponseDto,
} from 'src/application/dtos/online-course-payment'
import type { OnlineCourseInvoice, OnlineCoursePaymentAttempt } from 'src/domain/entities/online-course-payment'
import { OnlineCourseInvoiceStatus } from 'src/shared/enums'

export function toAdminOnlineCourseInvoiceResponse(
  invoice: OnlineCourseInvoice,
): AdminOnlineCourseInvoiceResponseDto {
  const items = invoice.items ?? []
  const attempts = [...(invoice.paymentAttempts ?? [])]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(toAdminOnlineCoursePaymentAttemptResponse)
  const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null
  const payableItems = items.filter((item) => item.courseId)

  return {
    invoiceId: invoice.invoiceId,
    invoiceCode: invoice.invoiceCode,
    buyerUserId: invoice.buyerUserId,
    studentId: invoice.studentId,
    status: invoice.status,
    currency: invoice.currency,
    subtotalAmount: invoice.subtotalAmount,
    discountAmount: invoice.discountAmount,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    refundedAmount: invoice.refundedAmount,
    paymentProvider: invoice.paymentProvider ?? null,
    providerOrderId: invoice.providerOrderId ?? null,
    checkoutUrl: invoice.checkoutUrl ?? null,
    qrCodeUrl: invoice.qrCodeUrl ?? null,
    expiresAt: invoice.expiresAt ?? null,
    paidAt: invoice.paidAt ?? null,
    canceledAt: invoice.canceledAt ?? null,
    refundedAt: invoice.refundedAt ?? null,
    cancelReason: invoice.cancelReason ?? null,
    notes: invoice.notes ?? null,
    metadata: invoice.metadata,
    items: items.map((item) => ({
      invoiceItemId: item.invoiceItemId,
      invoiceId: item.invoiceId,
      courseId: item.courseId ?? null,
      enrollmentId: item.enrollmentId ?? null,
      courseCode: item.courseCode ?? null,
      courseTitle: item.courseTitle,
      unitPriceAmount: item.unitPriceAmount,
      quantity: item.quantity,
      discountAmount: item.discountAmount,
      totalAmount: item.totalAmount,
      metadata: item.metadata,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    paymentAttempts: attempts,
    latestAttempt,
    enrollmentCreated:
      invoice.status === OnlineCourseInvoiceStatus.PAID &&
      payableItems.length > 0 &&
      payableItems.every((item) => !!item.enrollmentId),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  }
}

export function toAdminOnlineCoursePaymentAttemptResponse(
  attempt: OnlineCoursePaymentAttempt,
): AdminOnlineCoursePaymentAttemptResponseDto {
  return {
    attemptId: attempt.attemptId,
    attemptCode: attempt.attemptCode,
    invoiceId: attempt.invoiceId,
    provider: attempt.provider,
    status: attempt.status,
    amount: attempt.amount,
    currency: attempt.currency,
    providerOrderId: attempt.providerOrderId,
    providerTransactionId: attempt.providerTransactionId ?? null,
    providerResponseCode: attempt.providerResponseCode ?? null,
    providerMessage: attempt.providerMessage ?? null,
    providerBankCode: attempt.providerBankCode ?? null,
    providerBankTranNo: attempt.providerBankTranNo ?? null,
    providerCardType: attempt.providerCardType ?? null,
    providerPayDate: attempt.providerPayDate ?? null,
    paidAt: attempt.paidAt ?? null,
    failedAt: attempt.failedAt ?? null,
    canceledAt: attempt.canceledAt ?? null,
    expiredAt: attempt.expiredAt ?? null,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  }
}

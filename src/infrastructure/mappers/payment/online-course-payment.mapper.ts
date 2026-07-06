import {
  OnlineCourseInvoice,
  OnlineCourseInvoiceItem,
  OnlineCoursePaymentAttempt,
} from '../../../domain/entities/online-course-payment'
import { OnlineCourseInvoiceStatus, OnlinePaymentAttemptStatus, OnlinePaymentProvider } from '../../../shared/enums'

export class OnlineCoursePaymentMapper {
  static toDomainInvoice(prismaInvoice: any): OnlineCourseInvoice | null {
    if (!prismaInvoice) return null

    return new OnlineCourseInvoice({
      invoiceId: prismaInvoice.invoiceId,
      invoiceCode: prismaInvoice.invoiceCode,
      buyerUserId: prismaInvoice.buyerUserId,
      studentId: prismaInvoice.studentId,
      status: prismaInvoice.status as OnlineCourseInvoiceStatus,
      currency: prismaInvoice.currency,
      subtotalAmount: prismaInvoice.subtotalAmount,
      discountAmount: prismaInvoice.discountAmount,
      totalAmount: prismaInvoice.totalAmount,
      paidAmount: prismaInvoice.paidAmount,
      refundedAmount: prismaInvoice.refundedAmount,
      paymentProvider: prismaInvoice.paymentProvider as OnlinePaymentProvider | null,
      providerOrderId: prismaInvoice.providerOrderId ?? null,
      checkoutUrl: prismaInvoice.checkoutUrl ?? null,
      qrCodeUrl: prismaInvoice.qrCodeUrl ?? null,
      expiresAt: prismaInvoice.expiresAt ?? null,
      paidAt: prismaInvoice.paidAt ?? null,
      canceledAt: prismaInvoice.canceledAt ?? null,
      refundedAt: prismaInvoice.refundedAt ?? null,
      cancelReason: prismaInvoice.cancelReason ?? null,
      notes: prismaInvoice.notes ?? null,
      metadata: prismaInvoice.metadata,
      createdAt: prismaInvoice.createdAt,
      updatedAt: prismaInvoice.updatedAt,
      items: this.toDomainInvoiceItems(prismaInvoice.items),
      paymentAttempts: this.toDomainPaymentAttempts(prismaInvoice.paymentAttempts),
    })
  }

  static toDomainInvoices(prismaInvoices?: any[] | null): OnlineCourseInvoice[] {
    if (!prismaInvoices?.length) return []
    return prismaInvoices.map((invoice) => this.toDomainInvoice(invoice)).filter(Boolean) as OnlineCourseInvoice[]
  }

  static toDomainInvoiceItem(prismaItem: any): OnlineCourseInvoiceItem | null {
    if (!prismaItem) return null

    return new OnlineCourseInvoiceItem({
      invoiceItemId: prismaItem.invoiceItemId,
      invoiceId: prismaItem.invoiceId,
      courseId: prismaItem.courseId ?? null,
      enrollmentId: prismaItem.enrollmentId ?? null,
      courseCode: prismaItem.courseCode ?? null,
      courseTitle: prismaItem.courseTitle,
      unitPriceAmount: prismaItem.unitPriceAmount,
      quantity: prismaItem.quantity,
      discountAmount: prismaItem.discountAmount,
      totalAmount: prismaItem.totalAmount,
      metadata: prismaItem.metadata,
      createdAt: prismaItem.createdAt,
      updatedAt: prismaItem.updatedAt,
    })
  }

  static toDomainInvoiceItems(prismaItems?: any[] | null): OnlineCourseInvoiceItem[] {
    if (!prismaItems?.length) return []
    return prismaItems.map((item) => this.toDomainInvoiceItem(item)).filter(Boolean) as OnlineCourseInvoiceItem[]
  }

  static toDomainPaymentAttempt(prismaAttempt: any): OnlineCoursePaymentAttempt | null {
    if (!prismaAttempt) return null

    return new OnlineCoursePaymentAttempt({
      attemptId: prismaAttempt.attemptId,
      attemptCode: prismaAttempt.attemptCode,
      invoiceId: prismaAttempt.invoiceId,
      provider: prismaAttempt.provider as OnlinePaymentProvider,
      status: prismaAttempt.status as OnlinePaymentAttemptStatus,
      amount: prismaAttempt.amount,
      currency: prismaAttempt.currency,
      providerOrderId: prismaAttempt.providerOrderId,
      qrContent: prismaAttempt.qrContent ?? null,
      providerTransactionId: prismaAttempt.providerTransactionId ?? null,
      providerResponseCode: prismaAttempt.providerResponseCode ?? null,
      providerMessage: prismaAttempt.providerMessage ?? null,
      providerBankCode: prismaAttempt.providerBankCode ?? null,
      providerBankTranNo: prismaAttempt.providerBankTranNo ?? null,
      providerCardType: prismaAttempt.providerCardType ?? null,
      providerPayDate: prismaAttempt.providerPayDate ?? null,
      checkoutUrl: prismaAttempt.checkoutUrl ?? null,
      qrCodeUrl: prismaAttempt.qrCodeUrl ?? null,
      requestPayload: prismaAttempt.requestPayload,
      responsePayload: prismaAttempt.responsePayload,
      callbackPayload: prismaAttempt.callbackPayload,
      paidAt: prismaAttempt.paidAt ?? null,
      failedAt: prismaAttempt.failedAt ?? null,
      canceledAt: prismaAttempt.canceledAt ?? null,
      expiredAt: prismaAttempt.expiredAt ?? null,
      cancelReason: prismaAttempt.cancelReason ?? null,
      createdAt: prismaAttempt.createdAt,
      updatedAt: prismaAttempt.updatedAt,
    })
  }

  static toDomainPaymentAttempts(prismaAttempts?: any[] | null): OnlineCoursePaymentAttempt[] {
    if (!prismaAttempts?.length) return []
    return prismaAttempts
      .map((attempt) => this.toDomainPaymentAttempt(attempt))
      .filter(Boolean) as OnlineCoursePaymentAttempt[]
  }
}

import { Injectable } from '@nestjs/common'
import { CoursePaymentIntentRealtimeService, TuitionPaymentIntentRealtimeService } from 'src/application/interfaces'
import { BankTransferProcessingStatus, BankTransferTransactionType } from 'src/shared/enums'
import type { ProcessSepayTransactionResult } from './sepay-transaction-processing.types'

@Injectable()
export class SepayPaymentConfirmationNotifierService {
  constructor(
    private readonly tuitionPaymentIntentRealtimeService: TuitionPaymentIntentRealtimeService,
    private readonly coursePaymentIntentRealtimeService: CoursePaymentIntentRealtimeService,
  ) {}

  notify(result: ProcessSepayTransactionResult): void {
    if (result.duplicate || result.processingStatus !== BankTransferProcessingStatus.MATCHED) return

    if (
      result.type === BankTransferTransactionType.COURSE_PURCHASE &&
      result.paymentIntentId &&
      result.courseEnrollmentId &&
      result.intentStatus &&
      result.intentUpdatedAt
    ) {
      this.coursePaymentIntentRealtimeService.notifyIntentPaid({
        paymentIntentId: result.paymentIntentId,
        courseEnrollmentId: result.courseEnrollmentId,
        intentStatus: result.intentStatus,
        paidAt: result.paidAt ?? null,
        intentUpdatedAt: result.intentUpdatedAt,
      })
      return
    }

    if (!result.paymentId) return

    if (result.paymentIntentId && result.tuitionPaymentStatus && result.intentStatus && result.intentUpdatedAt) {
      this.tuitionPaymentIntentRealtimeService.notifyIntentPaid({
        paymentIntentId: result.paymentIntentId,
        tuitionPaymentId: result.paymentId,
        tuitionPaymentStatus: result.tuitionPaymentStatus,
        intentStatus: result.intentStatus,
        paidAt: result.paidAt ?? null,
        intentUpdatedAt: result.intentUpdatedAt,
      })
    }
  }
}

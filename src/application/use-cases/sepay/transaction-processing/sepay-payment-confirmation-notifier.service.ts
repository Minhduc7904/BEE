import { Injectable } from '@nestjs/common'
import { CreateAndNotifyOneUseCase } from 'src/application/use-cases/notification/create-and-notify-one.use-case'
import { SendTuitionPaymentToParentUseCase } from 'src/application/use-cases/tuition-payment/send-tuition-payment-to-parent.use-case'
import { CoursePaymentIntentRealtimeService, TuitionPaymentIntentRealtimeService } from 'src/application/interfaces'
import {
  BankTransferProcessingStatus,
  NotificationLevel,
  NotificationType,
  TuitionPaymentStatus,
  BankTransferTransactionType,
} from 'src/shared/enums'
import type { ProcessSepayTransactionResult } from './sepay-transaction-processing.types'

@Injectable()
export class SepayPaymentConfirmationNotifierService {
  constructor(
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
    private readonly sendTuitionPaymentToParentUseCase: SendTuitionPaymentToParentUseCase,
    private readonly tuitionPaymentIntentRealtimeService: TuitionPaymentIntentRealtimeService,
    private readonly coursePaymentIntentRealtimeService: CoursePaymentIntentRealtimeService,
  ) {}

  async notify(result: ProcessSepayTransactionResult): Promise<void> {
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

    if (result.studentUserId) {
      this.createAndNotifyOne
        .execute({
          userId: result.studentUserId,
          title: 'Xác nhận thanh toán học phí',
          message: 'Học phí của bạn đã được SePay xác nhận thanh toán thành công.',
          type: NotificationType.TUITION,
          level: NotificationLevel.SUCCESS,
          data: { paymentId: result.paymentId, status: TuitionPaymentStatus.PAID },
        })
        .catch(() => undefined)
    }

    await this.sendTuitionPaymentToParentUseCase.execute({ paymentId: result.paymentId }).catch(() => undefined)
  }
}

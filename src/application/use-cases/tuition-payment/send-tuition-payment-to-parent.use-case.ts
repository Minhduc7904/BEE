import { Inject, Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import type { IUnitOfWork } from 'src/domain/repositories'
import { TuitionPaymentParentMessageTemplate } from 'src/infrastructure/templates/tuition-payment-parent-message.template'
import { BusinessNotificationQueueService } from '../notification/business-notification-queue.service'
import { NotificationLevel, NotificationType } from 'src/shared/enums'

interface SendTuitionPaymentToParentInput {
  paymentId: number
  appId?: string
}

@Injectable()
export class SendTuitionPaymentToParentUseCase {
  private static readonly DEFAULT_APP_ID = '443601004373365149'

  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly queue: BusinessNotificationQueueService,
  ) { }

  async execute(input: SendTuitionPaymentToParentInput): Promise<boolean> {
    const appId = input.appId || process.env.ZALO_APP_ID || SendTuitionPaymentToParentUseCase.DEFAULT_APP_ID

    const payment = await this.unitOfWork.executeInTransaction(async (repos) => {
      return repos.tuitionPaymentRepository.findById(input.paymentId)
    })

    if (!payment) {
      return false
    }

    const messageText = TuitionPaymentParentMessageTemplate.render(payment)
    const studentName = payment.student?.user
      ? `${payment.student.user.lastName || ''} ${payment.student.user.firstName || ''}`.trim()
      : `#${payment.studentId}`
    const payload = {
      title: `Thông báo học phí: ${studentName}`,
      message: messageText,
      type: NotificationType.TUITION,
      level: NotificationLevel.INFO,
      data: { paymentId: String(payment.paymentId), studentId: String(payment.studentId), status: payment.status },
    }
    const digest = createHash('sha256').update(messageText).digest('hex').slice(0, 24)
    const queued = await this.queue.enqueueStudentAndParents({
      idempotencyKey: `tuition:${payment.paymentId}:${payment.status}:${digest}`,
      sourceType: 'TUITION_PAYMENT',
      sourceId: String(payment.paymentId),
      sourceEvent: 'PARENT_NOTIFY',
      title: payload.title,
      message: payload.message,
      type: payload.type,
      level: payload.level,
      data: payload.data,
      targets: [{
        studentId: payment.studentId,
        parentPayload: payload,
        parentZaloId: payment.student?.parentZaloId,
        zaloPayload: payload,
        zaloAppId: appId,
      }],
    })
    return Boolean(queued)
  }
}

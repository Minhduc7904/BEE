import { Inject, Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import { TuitionPaymentParentMessageTemplate } from 'src/infrastructure/templates/tuition-payment-parent-message.template'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BusinessNotificationQueueService } from '../notification/business-notification-queue.service'
import { NotificationLevel, NotificationType } from 'src/shared/enums'

interface SendBulkTuitionPaymentToParentInput {
    paymentIds: number[]
    appId?: string
    concurrency?: number
}

interface SendBulkTuitionPaymentToParentResult {
    requestedCount: number
    sentCount: number
    failedCount: number
}

interface TuitionPaymentNotificationJob {
    paymentId: number
    studentId: number
    parentZaloId: string | undefined
    messageText: string
}

@Injectable()
export class SendBulkTuitionPaymentToParentUseCase {
    private static readonly DEFAULT_APP_ID = '443601004373365149'

    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly queue: BusinessNotificationQueueService,
    ) { }

    async execute(input: SendBulkTuitionPaymentToParentInput): Promise<SendBulkTuitionPaymentToParentResult> {
        const uniquePaymentIds = [...new Set(input.paymentIds)].filter((paymentId) => Number.isInteger(paymentId) && paymentId > 0)

        if (uniquePaymentIds.length === 0) {
            return {
                requestedCount: 0,
                sentCount: 0,
                failedCount: 0,
            }
        }

        const appId = input.appId || process.env.ZALO_APP_ID || SendBulkTuitionPaymentToParentUseCase.DEFAULT_APP_ID
        const jobs = await this.buildJobs(uniquePaymentIds)
        if (jobs.length === 0) {
            return {
                requestedCount: uniquePaymentIds.length,
                sentCount: 0,
                failedCount: uniquePaymentIds.length,
            }
        }

        const digest = createHash('sha256')
            .update(jobs.map((job) => `${job.paymentId}:${job.messageText}`).sort().join('|'))
            .digest('hex').slice(0, 24)
        const queued = await this.queue.enqueueStudentAndParents({
            idempotencyKey: `tuition-bulk:${digest}`,
            sourceType: 'TUITION_PAYMENT',
            sourceId: `bulk:${digest}`,
            sourceEvent: 'BULK_PARENT_NOTIFY',
            title: 'Thông báo học phí',
            message: `Thông báo học phí cho ${jobs.length} học sinh`,
            type: NotificationType.TUITION,
            level: NotificationLevel.INFO,
            targets: jobs.map((job) => {
                const payload = {
                    title: 'Thông báo học phí',
                    message: job.messageText,
                    type: NotificationType.TUITION,
                    level: NotificationLevel.INFO,
                    data: { paymentId: String(job.paymentId), studentId: String(job.studentId) },
                }
                return {
                    studentId: job.studentId,
                    parentPayload: payload,
                    parentZaloId: job.parentZaloId,
                    zaloPayload: payload,
                    zaloAppId: appId,
                }
            }),
        })
        return {
            requestedCount: uniquePaymentIds.length,
            sentCount: queued ? jobs.length : 0,
            failedCount: queued ? uniquePaymentIds.length - jobs.length : uniquePaymentIds.length,
        }
    }

    private async buildJobs(paymentIds: number[]): Promise<TuitionPaymentNotificationJob[]> {
        const payments = await this.unitOfWork.executeInTransaction(async (repos) => {
            return Promise.all(paymentIds.map((paymentId) => repos.tuitionPaymentRepository.findById(paymentId)))
        })

        return payments
            .filter((payment): payment is NonNullable<typeof payment> => Boolean(payment))
            .map((payment) => {
                return {
                    paymentId: payment.paymentId,
                    studentId: payment.studentId,
                    parentZaloId: payment.student?.parentZaloId || undefined,
                    messageText: TuitionPaymentParentMessageTemplate.render(payment),
                }
            })
            .filter((job): job is TuitionPaymentNotificationJob => Boolean(job))
    }
}

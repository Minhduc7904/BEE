import { Inject, Injectable } from '@nestjs/common'
import { ZaloService } from 'src/application/interfaces'
import { TuitionPaymentParentMessageTemplate } from 'src/infrastructure/templates/tuition-payment-parent-message.template'
import { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'
import type { IUnitOfWork } from 'src/domain/repositories'

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
    parentZaloId: string
    messageText: string
}

@Injectable()
export class SendBulkTuitionPaymentToParentUseCase {
    private static readonly DEFAULT_APP_ID = '443601004373365149'
    private static readonly DEFAULT_CONCURRENCY = 10

    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly zaloService: ZaloService,
        private readonly getValidZaloAccessTokenUseCase: GetValidZaloAccessTokenUseCase,
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
        const accessToken = await this.getValidZaloAccessTokenUseCase.execute({ appId })

        if (!accessToken) {
            console.warn(`[Tuition->Parent][Bulk] Không tìm thấy access token cho app_id=${appId}`)
            return {
                requestedCount: uniquePaymentIds.length,
                sentCount: 0,
                failedCount: uniquePaymentIds.length,
            }
        }

        const jobs = await this.buildJobs(uniquePaymentIds)
        if (jobs.length === 0) {
            return {
                requestedCount: uniquePaymentIds.length,
                sentCount: 0,
                failedCount: uniquePaymentIds.length,
            }
        }

        const concurrency = Math.max(1, input.concurrency || SendBulkTuitionPaymentToParentUseCase.DEFAULT_CONCURRENCY)
        let sentCount = 0
        let failedCount = 0

        for (let i = 0; i < jobs.length; i += concurrency) {
            const chunk = jobs.slice(i, i + concurrency)
            const settled = await Promise.allSettled(
                chunk.map((job) =>
                    this.zaloService.sendMessage(accessToken, {
                        recipient: { user_id: job.parentZaloId },
                        message: { text: job.messageText },
                    }),
                ),
            )

            settled.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    sentCount += 1
                    return
                }

                failedCount += 1
                const job = chunk[index]
                const reason: any = result.reason
                const errorMessage =
                    reason?.response?.data?.error_description ||
                    reason?.response?.data?.message ||
                    reason?.message ||
                    'Unknown Zalo send error'

                console.warn('[Tuition->Parent][Bulk] Gửi Zalo thất bại, bỏ qua để không ảnh hưởng luồng chính:', {
                    paymentId: job.paymentId,
                    studentId: job.studentId,
                    parentZaloId: job.parentZaloId,
                    errorMessage,
                })
            })
        }

        const skippedCount = uniquePaymentIds.length - jobs.length
        return {
            requestedCount: uniquePaymentIds.length,
            sentCount,
            failedCount: failedCount + skippedCount,
        }
    }

    private async buildJobs(paymentIds: number[]): Promise<TuitionPaymentNotificationJob[]> {
        const payments = await this.unitOfWork.executeInTransaction(async (repos) => {
            return Promise.all(paymentIds.map((paymentId) => repos.tuitionPaymentRepository.findById(paymentId)))
        })

        return payments
            .filter((payment): payment is NonNullable<typeof payment> => Boolean(payment))
            .map((payment) => {
                const parentZaloId = payment.student?.parentZaloId
                if (!parentZaloId) {
                    return null
                }

                return {
                    paymentId: payment.paymentId,
                    studentId: payment.studentId,
                    parentZaloId,
                    messageText: TuitionPaymentParentMessageTemplate.render(payment),
                }
            })
            .filter((job): job is TuitionPaymentNotificationJob => Boolean(job))
    }
}

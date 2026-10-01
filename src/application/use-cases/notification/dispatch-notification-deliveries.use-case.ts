import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { NotificationDelivery } from '../../../domain/entities/notification'
import type { IUnitOfWork } from '../../../domain/repositories'
import {
  BackgroundJobCode,
  BackgroundJobRunStatus,
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
  NotificationDispatchJobStatus,
} from '../../../shared/enums'
import { NotificationRealtimeService, PushNotificationService, ZaloService } from '../../interfaces'
import { PushNotificationEligibilityService } from './push-notification-eligibility.service'
import { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'

const JOB_CONFIG = {
  code: BackgroundJobCode.NOTIFICATION_DELIVERY_DISPATCHER,
  displayName: 'Điều phối notification nền',
  cronExpression: '0 * * * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  isEnabled: true,
  maxRuntimeSeconds: 120,
} as const
const DELIVERY_BATCH_SIZE = 100
const PROCESSING_WINDOW_MILLISECONDS = 50_000
const DELIVERY_LEASE_MILLISECONDS = 120_000

export interface NotificationDispatchRunResult {
  backgroundJobRunId: number
  claimed: number
  sent: number
  skipped: number
  retried: number
  dead: number
  recovered: number
}

@Injectable()
export class DispatchNotificationDeliveriesUseCase {
  private readonly logger = new Logger(DispatchNotificationDeliveriesUseCase.name)

  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly realtimeService: NotificationRealtimeService,
    private readonly pushService: PushNotificationService,
    private readonly pushEligibility: PushNotificationEligibilityService,
    private readonly zaloService: ZaloService,
    private readonly getValidZaloAccessToken: GetValidZaloAccessTokenUseCase,
  ) {}

  async executeScheduled(workerId: string): Promise<NotificationDispatchRunResult | null> {
    const now = new Date()
    const hasDue = await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDeliveryRepository.hasDue(now),
    )
    if (!hasDue) return null

    const job = await this.unitOfWork.executeInTransaction((repos) => repos.backgroundJobRepository.upsert(JOB_CONFIG))
    if (!job.canRun()) return null

    const execution = await this.acquireExecution(job.backgroundJobId, job.maxRuntimeSeconds, workerId)
    if (!execution) throw new ConflictException('NOTIFICATION_DELIVERY_DISPATCHER_ALREADY_RUNNING')

    const result: Omit<NotificationDispatchRunResult, 'backgroundJobRunId'> = {
      claimed: 0,
      sent: 0,
      skipped: 0,
      retried: 0,
      dead: 0,
      recovered: 0,
    }
    const stopAt = Date.now() + PROCESSING_WINDOW_MILLISECONDS

    try {
      const recovery = await this.unitOfWork.executeInTransaction((repos) =>
        repos.notificationDeliveryRepository.recoverExpired(new Date()),
      )
      result.recovered = recovery.count
      for (const jobId of recovery.notificationDispatchJobIds) await this.refreshJob(jobId)

      while (Date.now() < stopAt) {
        const claimedAt = new Date()
        const deliveries = await this.unitOfWork.executeInTransaction((repos) =>
          repos.notificationDeliveryRepository.claimDueBatch(
            workerId,
            claimedAt,
            new Date(claimedAt.getTime() + DELIVERY_LEASE_MILLISECONDS),
            DELIVERY_BATCH_SIZE,
          ),
        )
        if (deliveries.length === 0) break
        result.claimed += deliveries.length

        const outcomes = await this.processWithConcurrency(deliveries, 10)
        for (const outcome of outcomes) result[outcome] += 1

        const jobIds = Array.from(new Set(deliveries.map((delivery) => delivery.job!.notificationDispatchJobId)))
        for (const jobId of jobIds) await this.refreshJob(jobId)
        if (deliveries.length < DELIVERY_BATCH_SIZE) break
      }

      await this.completeExecution(execution.backgroundJobRunId, result)
      return { backgroundJobRunId: execution.backgroundJobRunId, ...result }
    } catch (error) {
      await this.failExecution(execution.backgroundJobRunId, error)
      throw error
    } finally {
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.backgroundJobLockRepository.release(execution.backgroundJobId, execution.lockToken),
      )
    }
  }

  private async processWithConcurrency(
    deliveries: NotificationDelivery[],
    concurrency: number,
  ): Promise<Array<'sent' | 'skipped' | 'retried' | 'dead'>> {
    const outcomes: Array<'sent' | 'skipped' | 'retried' | 'dead'> = []
    const deliveryPhases = [
      deliveries.filter((delivery) => delivery.channel === NotificationDeliveryChannel.IN_APP),
      deliveries.filter((delivery) => delivery.channel !== NotificationDeliveryChannel.IN_APP),
    ]

    for (const phase of deliveryPhases) {
      for (let offset = 0; offset < phase.length; offset += concurrency) {
        outcomes.push(
          ...(await Promise.all(phase.slice(offset, offset + concurrency).map((item) => this.process(item)))),
        )
      }
    }
    return outcomes
  }

  private async process(delivery: NotificationDelivery): Promise<'sent' | 'skipped' | 'retried' | 'dead'> {
    try {
      if (!delivery.job) return this.skip(delivery, 'JOB_UNAVAILABLE')
      if (delivery.channel === NotificationDeliveryChannel.ZALO_OA) return this.processZalo(delivery)
      if (!delivery.recipient?.userId) return this.skip(delivery, 'RECIPIENT_UNAVAILABLE')
      if (delivery.channel === NotificationDeliveryChannel.IN_APP) return this.processInApp(delivery)

      const eligibility = await this.pushEligibility.evaluate(delivery.recipient.userId, delivery.job.type)
      if (!eligibility.allowed) return this.skip(delivery, eligibility.skipReason ?? 'PUSH_NOT_ALLOWED')

      return this.processPush(delivery)
    } catch (error) {
      return this.retryOrDead(
        delivery,
        `${delivery.channel}_UNEXPECTED_ERROR`,
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  private async processInApp(delivery: NotificationDelivery): Promise<'sent'> {
    const userId = delivery.recipient!.userId!
    const job = delivery.job!
    const payload = delivery.payload ?? job
    const notification = await this.unitOfWork.executeInTransaction(async (repos) => {
      const created = await repos.notificationRepository.createForDispatchRecipient(
        delivery.notificationDispatchRecipientId,
        {
          userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          level: payload.level,
          data: payload.data,
        },
      )
      await repos.notificationDeliveryRepository.update(delivery.notificationDeliveryId, {
        status: NotificationDeliveryStatus.SENT,
        sentAt: new Date(),
        providerMessageId: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,
      })
      return created
    })
    try {
      this.realtimeService.notifyUser(userId, notification)
      const stats = await this.unitOfWork.executeInTransaction((repos) =>
        repos.notificationRepository.getStatsByUserId(userId),
      )
      this.realtimeService.notifyStatsUpdated(userId, stats)
    } catch (error) {
      this.logger.warn(
        `Không thể phát realtime notification #${notification.notificationId}; dữ liệu IN_APP đã được lưu`,
        error instanceof Error ? error.stack : undefined,
      )
    }
    return 'sent'
  }

  private async processPush(delivery: NotificationDelivery): Promise<'sent' | 'skipped' | 'retried' | 'dead'> {
    const userId = delivery.recipient!.userId!
    const job = delivery.job!
    const payload = delivery.payload ?? job
    const context = await this.unitOfWork.executeInTransaction(async (repos) => ({
      devices: await repos.userDeviceRepository.findByUserIds([userId]),
      notification: await repos.notificationRepository.findByDispatchRecipientId(
        delivery.notificationDispatchRecipientId,
      ),
    }))
    if (context.devices.length === 0) return this.skip(delivery, 'NO_ACTIVE_DEVICE')

    const activeTokens = new Set(context.devices.map((device) => device.fcmToken))
    const tokens = delivery.pendingPushTokens?.length
      ? delivery.pendingPushTokens.filter((token) => activeTokens.has(token))
      : Array.from(activeTokens)
    if (tokens.length === 0) return this.skip(delivery, 'NO_ACTIVE_DEVICE')

    const result = await this.pushService.sendToTokens(
      tokens,
      {
        title: payload.title,
        body: payload.message,
        data: {
          ...this.toPushData(payload.data),
          notificationDispatchJobId: String(job.notificationDispatchJobId),
          ...(context.notification && { notificationId: String(context.notification.notificationId) }),
        },
      },
    )
    if (result.invalidTokens.length > 0) {
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.userDeviceRepository.deleteByTokens(result.invalidTokens),
      )
    }
    if (!result.providerAvailable) {
      return this.retryOrDead(delivery, 'PUSH_PROVIDER_DISABLED', 'Firebase Cloud Messaging đang tắt')
    }

    const invalidTokens = new Set(result.invalidTokens)
    const retryableFailures = result.outcomes.filter(
      (outcome) => !outcome.success && outcome.retryable && !invalidTokens.has(outcome.token),
    )
    const permanentFailures = result.outcomes.filter(
      (outcome) => !outcome.success && !outcome.retryable && !invalidTokens.has(outcome.token),
    )
    if (permanentFailures.length > 0) {
      const errorCode = permanentFailures.find((outcome) => outcome.errorCode)?.errorCode ?? 'PUSH_SEND_FAILED'
      return this.markDead(
        delivery,
        errorCode,
        `FCM từ chối vĩnh viễn ${permanentFailures.length} thiết bị`,
      )
    }
    if (retryableFailures.length > 0) {
      const errorCode = retryableFailures.find((outcome) => outcome.errorCode)?.errorCode ?? 'PUSH_SEND_FAILED'
      return this.retryOrDead(
        delivery,
        errorCode,
        `FCM tạm thời không gửi được tới ${retryableFailures.length} thiết bị`,
        retryableFailures.map((outcome) => outcome.token),
      )
    }
    if (result.successCount > 0) {
      const providerMessageId = result.outcomes.find((outcome) => outcome.success)?.messageId
      await this.markSent(delivery.notificationDeliveryId, providerMessageId)
      return 'sent'
    }
    if (result.outcomes.length > 0 && result.outcomes.every((outcome) => invalidTokens.has(outcome.token))) {
      return this.skip(delivery, 'NO_ACTIVE_DEVICE')
    }
    const errorCode = result.outcomes.find((outcome) => outcome.errorCode)?.errorCode ?? 'PUSH_SEND_FAILED'
    return this.markDead(delivery, errorCode, 'FCM không trả về kết quả giao nhận hợp lệ')
  }

  private toPushData(data?: Record<string, unknown>): Record<string, string> {
    if (!data) return {}
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        typeof value === 'string' ? value : (JSON.stringify(value) ?? String(value)),
      ]),
    )
  }

  private async processZalo(delivery: NotificationDelivery): Promise<'sent' | 'skipped' | 'retried' | 'dead'> {
    if (!delivery.destination) return this.skip(delivery, 'NO_ZALO_RECIPIENT_ID')
    const appId = delivery.providerAppId || process.env.ZALO_APP_ID || '443601004373365149'
    const accessToken = await this.getValidZaloAccessToken.execute({ appId })
    if (!accessToken) {
      return this.retryOrDead(delivery, 'ZALO_ACCESS_TOKEN_UNAVAILABLE', `Không có access token cho app_id=${appId}`)
    }
    const payload = delivery.payload ?? delivery.job!
    try {
      const response = await this.zaloService.sendMessage(accessToken, {
        recipient: { user_id: delivery.destination },
        message: { text: payload.message },
      })
      await this.markSent(delivery.notificationDeliveryId, response?.data?.message_id)
      await this.markAttendanceParentNotified(delivery)
      return 'sent'
    } catch (error: any) {
      const status = error?.response?.status ?? error?.status
      const message = error?.response?.data?.error_description || error?.response?.data?.message || error?.message || 'Zalo OA gửi thất bại'
      const providerError = error?.response?.data?.error ?? /error=(-?\d+)/.exec(message)?.[1]
      const permanent = (status >= 400 && status < 500 && status !== 429) || message.includes('Zalo API từ chối')
      if (permanent) return this.markDead(delivery, providerError ? `ZALO_${providerError}` : 'ZALO_PROVIDER_REJECTED', message)
      return this.retryOrDead(delivery, status === 429 ? 'ZALO_RATE_LIMITED' : 'ZALO_SEND_FAILED', message)
    }
  }

  private async markAttendanceParentNotified(delivery: NotificationDelivery): Promise<void> {
    const job = delivery.job
    if (job?.sourceType !== 'ATTENDANCE' || !job.sourceId || !/^\d+$/.test(job.sourceId)) return
    try {
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.attendanceRepository.update(Number(job.sourceId), { parentNotified: true }),
      )
    } catch (error) {
      this.logger.warn(
        `Zalo đã gửi nhưng không cập nhật được parentNotified cho attendance #${job.sourceId}`,
        error instanceof Error ? error.stack : undefined,
      )
    }
  }

  private async markSent(notificationDeliveryId: number, providerMessageId?: string): Promise<void> {
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDeliveryRepository.update(notificationDeliveryId, {
        status: NotificationDeliveryStatus.SENT,
        sentAt: new Date(),
        pendingPushTokens: null,
        providerMessageId: providerMessageId ?? null,
        lastErrorCode: null,
        lastErrorMessage: null,
        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,
      }),
    )
  }

  private async skip(delivery: NotificationDelivery, reason: string): Promise<'skipped'> {
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDeliveryRepository.update(delivery.notificationDeliveryId, {
        status: NotificationDeliveryStatus.SKIPPED,
        skipReason: reason,
        pendingPushTokens: null,
        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,
      }),
    )
    return 'skipped'
  }

  private async retryOrDead(
    delivery: NotificationDelivery,
    errorCode: string,
    errorMessage: string,
    pendingPushTokens?: string[],
  ): Promise<'retried' | 'dead'> {
    if (!delivery.canRetry()) return this.markDead(delivery, errorCode, errorMessage)
    const delayMs = delivery.attemptCount <= 1 ? 60_000 : 300_000
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDeliveryRepository.update(delivery.notificationDeliveryId, {
        status: NotificationDeliveryStatus.RETRY_WAIT,
        availableAt: new Date(Date.now() + delayMs),
        ...(pendingPushTokens && { pendingPushTokens }),
        lastErrorCode: errorCode.slice(0, 100),
        lastErrorMessage: errorMessage.slice(0, 1_000),
        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,
      }),
    )
    return 'retried'
  }

  private async markDead(delivery: NotificationDelivery, errorCode: string, errorMessage: string): Promise<'dead'> {
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.notificationDeliveryRepository.update(delivery.notificationDeliveryId, {
        status: NotificationDeliveryStatus.DEAD,
        pendingPushTokens: null,
        lastErrorCode: errorCode.slice(0, 100),
        lastErrorMessage: errorMessage.slice(0, 1_000),
        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,
      }),
    )
    return 'dead'
  }

  private async refreshJob(notificationDispatchJobId: number): Promise<void> {
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const currentJob = await repos.notificationDispatchJobRepository.findById(notificationDispatchJobId)
      const counts = await repos.notificationDeliveryRepository.countByJob(notificationDispatchJobId)
      const unfinished = counts.pending + counts.processing + counts.retryWait
      let status = NotificationDispatchJobStatus.PROCESSING
      let finishedAt: Date | null = null
      if (unfinished === 0) {
        finishedAt = new Date()
        status =
          counts.dead === 0
            ? NotificationDispatchJobStatus.SUCCEEDED
            : counts.dead === counts.total
              ? NotificationDispatchJobStatus.FAILED
              : NotificationDispatchJobStatus.PARTIAL_FAILED
      }
      await repos.notificationDispatchJobRepository.update(notificationDispatchJobId, {
        status,
        startedAt: currentJob?.startedAt ?? new Date(),
        finishedAt,
        sentDeliveryCount: counts.sent,
        skippedDeliveryCount: counts.skipped,
        deadDeliveryCount: counts.dead,
      })
    })
  }

  private async acquireExecution(backgroundJobId: number, maxRuntimeSeconds: number, workerId: string) {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const now = new Date()
      const lockToken = randomUUID()
      const lock = await repos.backgroundJobLockRepository.tryAcquire({
        backgroundJobId,
        lockToken,
        workerId,
        lockedAt: now,
        leaseExpiresAt: new Date(now.getTime() + maxRuntimeSeconds * 1_000),
      })
      if (!lock) return null
      const latestRun = await repos.backgroundJobRunRepository.findLatestByBackgroundJobId(backgroundJobId)
      const scheduledAt = new Date(now)
      scheduledAt.setMilliseconds(0)
      if (latestRun && latestRun.scheduledAt >= scheduledAt)
        scheduledAt.setTime(latestRun.scheduledAt.getTime() + 1_000)
      const run = await repos.backgroundJobRunRepository.create({
        backgroundJobId,
        scheduledAt,
        startedAt: now,
        status: BackgroundJobRunStatus.RUNNING,
        workerId,
        lockToken,
        leaseExpiresAt: lock.leaseExpiresAt,
      })
      return { backgroundJobId, backgroundJobRunId: run.backgroundJobRunId, lockToken }
    })
  }

  private async completeExecution(
    backgroundJobRunId: number,
    result: Omit<NotificationDispatchRunResult, 'backgroundJobRunId'>,
  ): Promise<void> {
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.SUCCEEDED,
        finishedAt: new Date(),
        resultSummary: { ...result },
      }),
    )
  }

  private async failExecution(backgroundJobRunId: number, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message.slice(0, 1_000) : 'Lỗi điều phối notification không xác định'
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.FAILED,
        finishedAt: new Date(),
        errorCode: 'NOTIFICATION_DELIVERY_DISPATCHER_FAILED',
        errorMessage: message,
      }),
    )
  }
}

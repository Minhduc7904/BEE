import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { UnitOfWorkRepos } from '../../../domain/repositories'
import type { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import {
  NotificationDeliveryChannel,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
  NotificationAudienceType,
  NotificationRecipientType,
  NotificationDispatchJobStatus,
} from '../../../shared/enums'

const WRITE_CHUNK_SIZE = 1_000

export interface EnqueueNotificationDispatchJobInput {
  idempotencyKey: string
  requestFingerprint: string
  userIds: number[]
  channels: NotificationDeliveryChannel[]
  title: string
  message: string
  type?: NotificationType
  level?: NotificationLevel
  data?: Record<string, string>
  scheduledAt?: Date
  priority?: number
  createdByAdminId?: number
  audienceType?: NotificationAudienceType
  audienceRecipientType?: NotificationRecipientType
}

export interface EnqueueNotificationDispatchJobResult {
  notificationDispatchJobId: number
  recipientCount: number
  deliveryCount: number
  reused: boolean
  status: NotificationDispatchJobStatus
  sentDeliveryCount: number
  skippedDeliveryCount: number
  deadDeliveryCount: number
}

@Injectable()
export class EnqueueNotificationDispatchJobUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(input: EnqueueNotificationDispatchJobInput): Promise<EnqueueNotificationDispatchJobResult> {
    this.validate(input)
    const idempotencyKey = input.idempotencyKey.trim()

    return this.unitOfWork.executeInTransaction((repos) => this.executeWithRepos(repos, input))
  }

  async executeWithRepos(
    repos: UnitOfWorkRepos,
    input: EnqueueNotificationDispatchJobInput,
  ): Promise<EnqueueNotificationDispatchJobResult> {
    this.validate(input)
    const idempotencyKey = input.idempotencyKey.trim()
    const existing = await repos.notificationDispatchJobRepository.findByIdempotencyKey(idempotencyKey)
    if (existing) {
      if (existing.requestFingerprint && existing.requestFingerprint !== input.requestFingerprint) {
        throw new ConflictException('Idempotency-Key đã được sử dụng với nội dung khác')
      }
      return {
        notificationDispatchJobId: existing.notificationDispatchJobId,
        recipientCount: existing.recipientCount,
        deliveryCount: existing.totalDeliveryCount,
        reused: true,
        status: existing.status,
        sentDeliveryCount: existing.sentDeliveryCount,
        skippedDeliveryCount: existing.skippedDeliveryCount,
        deadDeliveryCount: existing.deadDeliveryCount,
      }
    }

    const resolvedSnapshots = await repos.notificationDispatchRecipientRepository.resolveSnapshots(
      Array.from(new Set(input.userIds)),
    )
    const snapshots = input.audienceRecipientType
      ? resolvedSnapshots.filter((recipient) => recipient.recipientType === input.audienceRecipientType)
      : resolvedSnapshots
    if (snapshots.length === 0) throw new BadRequestException('Không có người dùng đang hoạt động để gửi notification')

    const channels = Array.from(new Set(input.channels))
    const deliveryCount = snapshots.reduce(
      (total, recipient) =>
        total +
        channels.filter(
          (channel) =>
            channel !== NotificationDeliveryChannel.PUSH ||
            recipient.recipientType === NotificationRecipientType.PARENT,
        ).length,
      0,
    )
    if (deliveryCount === 0) throw new BadRequestException('Không có delivery hợp lệ cho các kênh đã chọn')
    const job = await repos.notificationDispatchJobRepository.create({
      jobType: snapshots.length === 1 ? NotificationDispatchJobType.SINGLE : NotificationDispatchJobType.BATCH,
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type ?? NotificationType.SYSTEM,
      level: input.level ?? NotificationLevel.INFO,
      data: input.data,
      scheduledAt: input.scheduledAt ?? new Date(),
      priority: input.priority ?? 0,
      idempotencyKey,
      requestFingerprint: input.requestFingerprint,
      audienceType: input.audienceType ?? NotificationAudienceType.SPECIFIC_USERS,
      audienceRecipientType: input.audienceRecipientType,
      requestedChannels: channels,
      recipientCount: snapshots.length,
      totalDeliveryCount: deliveryCount,
      createdByAdminId: input.createdByAdminId,
    })

    const recipients: NotificationDispatchRecipient[] = []
    for (let offset = 0; offset < snapshots.length; offset += WRITE_CHUNK_SIZE) {
      const chunk = snapshots.slice(offset, offset + WRITE_CHUNK_SIZE)
      recipients.push(
        ...(await repos.notificationDispatchRecipientRepository.createMany(
          chunk.map((recipient) => ({ notificationDispatchJobId: job.notificationDispatchJobId, ...recipient })),
        )),
      )
    }

    const availableAt = input.scheduledAt ?? new Date()
    const deliveries = recipients.flatMap((recipient) =>
      channels
        .filter(
          (channel) =>
            channel !== NotificationDeliveryChannel.PUSH ||
            recipient.recipientType === NotificationRecipientType.PARENT,
        )
        .map((channel) => ({
          notificationDispatchRecipientId: recipient.notificationDispatchRecipientId,
          channel,
          availableAt,
        })),
    )
    for (let offset = 0; offset < deliveries.length; offset += WRITE_CHUNK_SIZE) {
      await repos.notificationDeliveryRepository.createMany(deliveries.slice(offset, offset + WRITE_CHUNK_SIZE))
    }

    return {
      notificationDispatchJobId: job.notificationDispatchJobId,
      recipientCount: recipients.length,
      deliveryCount,
      reused: false,
      status: job.status,
      sentDeliveryCount: 0,
      skippedDeliveryCount: 0,
      deadDeliveryCount: 0,
    }
  }

  private validate(input: EnqueueNotificationDispatchJobInput): void {
    if (!input.idempotencyKey?.trim() || input.idempotencyKey.trim().length > 100) {
      throw new BadRequestException('Idempotency key là bắt buộc và không vượt quá 100 ký tự')
    }
    if (!input.requestFingerprint?.trim()) throw new BadRequestException('Request fingerprint là bắt buộc')
    if (!input.title?.trim() || input.title.trim().length > 255) {
      throw new BadRequestException('Tiêu đề là bắt buộc và không vượt quá 255 ký tự')
    }
    if (!input.message?.trim()) throw new BadRequestException('Nội dung notification là bắt buộc')
    if (!input.userIds?.length) throw new BadRequestException('Phải có ít nhất một người nhận')
    if (!input.channels?.length) throw new BadRequestException('Phải có ít nhất một kênh gửi')
  }
}

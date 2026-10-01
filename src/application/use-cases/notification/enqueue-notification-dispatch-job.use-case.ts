import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { UnitOfWorkRepos } from '../../../domain/repositories'
import type { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import type { NotificationDispatchRecipientCommand } from '../../../domain/interface/notification-dispatch'
import {
  NotificationDeliveryChannel,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
  NotificationAudienceType,
  NotificationRecipientType,
  NotificationDispatchJobStatus,
  NotificationRecipientKind,
} from '../../../shared/enums'

const WRITE_CHUNK_SIZE = 1_000

export interface EnqueueNotificationDispatchJobInput {
  idempotencyKey: string
  requestFingerprint: string
  userIds?: number[]
  channels?: NotificationDeliveryChannel[]
  recipients?: NotificationDispatchRecipientCommand[]
  title: string
  message: string
  type?: NotificationType
  level?: NotificationLevel
  data?: Record<string, unknown>
  scheduledAt?: Date
  priority?: number
  createdByAdminId?: number
  audienceType?: NotificationAudienceType
  audienceRecipientType?: NotificationRecipientType
  sourceType?: string
  sourceId?: string
  sourceEvent?: string
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
    try {
      return await this.unitOfWork.executeInTransaction((repos) => this.executeWithRepos(repos, input))
    } catch (error) {
      if (!this.isUniqueConflict(error)) throw error
      const existing = await this.unitOfWork.executeInTransaction((repos) =>
        repos.notificationDispatchJobRepository.findByIdempotencyKey(idempotencyKey),
      )
      if (!existing) throw error
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

    const recipientCommands = input.recipients?.length
      ? this.normalizeRecipientCommands(input.recipients)
      : await this.buildUserRecipientCommands(repos, input)
    if (recipientCommands.length === 0) {
      throw new BadRequestException('Không có người dùng đang hoạt động để gửi notification')
    }

    const channels = Array.from(new Set(recipientCommands.flatMap((recipient) => recipient.deliveries.map((item) => item.channel))))
    const deliveryCount = recipientCommands.reduce((total, recipient) => total + recipient.deliveries.length, 0)
    if (deliveryCount === 0) throw new BadRequestException('Không có delivery hợp lệ cho các kênh đã chọn')
    const job = await repos.notificationDispatchJobRepository.create({
      jobType: recipientCommands.length === 1 ? NotificationDispatchJobType.SINGLE : NotificationDispatchJobType.BATCH,
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
      recipientCount: recipientCommands.length,
      totalDeliveryCount: deliveryCount,
      createdByAdminId: input.createdByAdminId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceEvent: input.sourceEvent,
    })

    const recipients: NotificationDispatchRecipient[] = []
    for (let offset = 0; offset < recipientCommands.length; offset += WRITE_CHUNK_SIZE) {
      const chunk = recipientCommands.slice(offset, offset + WRITE_CHUNK_SIZE)
      recipients.push(
        ...(await repos.notificationDispatchRecipientRepository.createMany(
          chunk.map(({ deliveries: _deliveries, ...recipient }) => ({
            notificationDispatchJobId: job.notificationDispatchJobId,
            ...recipient,
          })),
        )),
      )
    }

    const availableAt = input.scheduledAt ?? new Date()
    const commandByKey = new Map(recipientCommands.map((recipient) => [recipient.recipientKey, recipient]))
    const deliveries = recipients.flatMap((recipient) => {
      const command = recipient.recipientKey ? commandByKey.get(recipient.recipientKey) : undefined
      return (command?.deliveries ?? []).map((delivery) => ({
          notificationDispatchRecipientId: recipient.notificationDispatchRecipientId,
          ...delivery,
          availableAt,
        }))
    })
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

  private async buildUserRecipientCommands(
    repos: UnitOfWorkRepos,
    input: EnqueueNotificationDispatchJobInput,
  ): Promise<NotificationDispatchRecipientCommand[]> {
    const resolvedSnapshots = await repos.notificationDispatchRecipientRepository.resolveSnapshots(
      Array.from(new Set(input.userIds ?? [])),
    )
    const snapshots = input.audienceRecipientType
      ? resolvedSnapshots.filter((recipient) => recipient.recipientType === input.audienceRecipientType)
      : resolvedSnapshots
    const payload = {
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type ?? NotificationType.SYSTEM,
      level: input.level ?? NotificationLevel.INFO,
      data: input.data,
    }
    return snapshots.map((recipient) => ({
      ...recipient,
      recipientKey: `USER:${recipient.userId}`,
      recipientKind: NotificationRecipientKind.USER,
      deliveries: Array.from(new Set(input.channels ?? []))
        .filter(
          (channel) =>
            channel !== NotificationDeliveryChannel.PUSH ||
            recipient.recipientType === NotificationRecipientType.PARENT,
        )
        .map((channel) => ({ channel, payload })),
    }))
  }

  private normalizeRecipientCommands(
    recipients: NotificationDispatchRecipientCommand[],
  ): NotificationDispatchRecipientCommand[] {
    const unique = new Map<string, NotificationDispatchRecipientCommand>()
    for (const recipient of recipients) {
      const deliveries = Array.from(
        new Map(recipient.deliveries.map((delivery) => [delivery.channel, delivery])).values(),
      )
      unique.set(recipient.recipientKey, { ...recipient, deliveries })
    }
    return Array.from(unique.values())
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
    if (!input.userIds?.length && !input.recipients?.length) throw new BadRequestException('Phải có ít nhất một người nhận')
    if (!input.recipients?.length && !input.channels?.length) throw new BadRequestException('Phải có ít nhất một kênh gửi')
  }

  private isUniqueConflict(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002')
  }
}

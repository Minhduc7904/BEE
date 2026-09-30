import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { NotificationDispatchRecipient } from '../../../domain/entities/notification'
import {
  NotificationDeliveryChannel,
  NotificationDispatchJobType,
  NotificationLevel,
  NotificationType,
} from '../../../shared/enums'

const WRITE_CHUNK_SIZE = 1_000

export interface EnqueueNotificationDispatchJobInput {
  idempotencyKey: string
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
}

export interface EnqueueNotificationDispatchJobResult {
  notificationDispatchJobId: number
  recipientCount: number
  deliveryCount: number
  reused: boolean
}

@Injectable()
export class EnqueueNotificationDispatchJobUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(input: EnqueueNotificationDispatchJobInput): Promise<EnqueueNotificationDispatchJobResult> {
    this.validate(input)
    const idempotencyKey = input.idempotencyKey.trim()

    return this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.notificationDispatchJobRepository.findByIdempotencyKey(idempotencyKey)
      if (existing) {
        return {
          notificationDispatchJobId: existing.notificationDispatchJobId,
          recipientCount: existing.recipientCount,
          deliveryCount: existing.totalDeliveryCount,
          reused: true,
        }
      }

      const requestedUserIds = Array.from(new Set(input.userIds))
      const userIds = await repos.userRepository.filterActiveUserIds(requestedUserIds)
      if (userIds.length === 0) throw new BadRequestException('Không có người dùng đang hoạt động để gửi notification')

      const channels = Array.from(new Set(input.channels))
      const deliveryCount = userIds.length * channels.length
      const job = await repos.notificationDispatchJobRepository.create({
        jobType: userIds.length === 1 ? NotificationDispatchJobType.SINGLE : NotificationDispatchJobType.BATCH,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type ?? NotificationType.SYSTEM,
        level: input.level ?? NotificationLevel.INFO,
        data: input.data,
        scheduledAt: input.scheduledAt ?? new Date(),
        priority: input.priority ?? 0,
        idempotencyKey,
        recipientCount: userIds.length,
        totalDeliveryCount: deliveryCount,
        createdByAdminId: input.createdByAdminId,
      })

      const recipients: NotificationDispatchRecipient[] = []
      for (let offset = 0; offset < userIds.length; offset += WRITE_CHUNK_SIZE) {
        const chunk = userIds.slice(offset, offset + WRITE_CHUNK_SIZE)
        recipients.push(
          ...(await repos.notificationDispatchRecipientRepository.createMany(
            chunk.map((userId) => ({ notificationDispatchJobId: job.notificationDispatchJobId, userId })),
          )),
        )
      }

      const availableAt = input.scheduledAt ?? new Date()
      const deliveries = recipients.flatMap((recipient) =>
        channels.map((channel) => ({
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
      }
    })
  }

  private validate(input: EnqueueNotificationDispatchJobInput): void {
    if (!input.idempotencyKey?.trim() || input.idempotencyKey.trim().length > 100) {
      throw new BadRequestException('Idempotency key là bắt buộc và không vượt quá 100 ký tự')
    }
    if (!input.title?.trim() || input.title.trim().length > 255) {
      throw new BadRequestException('Tiêu đề là bắt buộc và không vượt quá 255 ký tự')
    }
    if (!input.message?.trim()) throw new BadRequestException('Nội dung notification là bắt buộc')
    if (!input.userIds?.length) throw new BadRequestException('Phải có ít nhất một người nhận')
    if (!input.channels?.length) throw new BadRequestException('Phải có ít nhất một kênh gửi')
  }
}

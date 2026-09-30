import { Inject, Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'
import type { IUnitOfWork } from '../../../domain/repositories'
import type {
  NotificationDeliveryPayload,
  NotificationDispatchRecipientCommand,
  NotificationParentTarget,
  NotificationRecipientSnapshot,
} from '../../../domain/interface/notification-dispatch'
import type { CreateNotificationData } from '../../../domain/interface/notification/notification.interface'
import {
  NotificationAudienceType,
  NotificationDeliveryChannel,
  NotificationLevel,
  NotificationRecipientKind,
  NotificationRecipientType,
  NotificationType,
} from '../../../shared/enums'
import {
  EnqueueNotificationDispatchJobUseCase,
  type EnqueueNotificationDispatchJobResult,
} from './enqueue-notification-dispatch-job.use-case'

export interface BusinessNotificationSource {
  sourceType: string
  sourceId: string
  sourceEvent: string
  idempotencyKey: string
}

export interface StudentBusinessNotificationTarget {
  studentId: number
  studentUserId?: number
  studentPayload?: NotificationDeliveryPayload
  parentPayload?: NotificationDeliveryPayload
  parentZaloId?: string | null
  zaloPayload?: NotificationDeliveryPayload
  zaloAppId?: string
}

export interface EnqueueStudentBusinessNotificationsInput extends BusinessNotificationSource {
  title: string
  message: string
  type?: NotificationType
  level?: NotificationLevel
  data?: Record<string, string>
  targets: StudentBusinessNotificationTarget[]
}

interface EnqueueBusinessJobInput extends BusinessNotificationSource {
  title: string
  message: string
  type?: NotificationType
  level?: NotificationLevel
  data?: Record<string, string>
  recipients: NotificationDispatchRecipientCommand[]
}

@Injectable()
export class BusinessNotificationQueueService {
  private readonly logger = new Logger(BusinessNotificationQueueService.name)

  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly enqueueJob: EnqueueNotificationDispatchJobUseCase,
  ) {}

  async enqueueInApp(
    notifications: CreateNotificationData[],
    source?: Partial<BusinessNotificationSource>,
  ): Promise<EnqueueNotificationDispatchJobResult | null> {
    if (notifications.length === 0) return null
    const snapshots = await this.safeResolveUsers(notifications.map((item) => item.userId), source)
    if (!snapshots) return null
    const snapshotByUserId = new Map(snapshots.map((item) => [item.userId, item]))
    const recipients = notifications.flatMap((item, index) => {
      const snapshot = snapshotByUserId.get(item.userId)
      if (!snapshot) return []
      return [this.userCommand(snapshot, `USER:${item.userId}:${index}`, [
        { channel: NotificationDeliveryChannel.IN_APP, payload: this.payload(item) },
      ])]
    })
    const first = notifications[0]
    const normalizedSource = this.sourceOrLegacy(source, notifications)
    return this.safeEnqueue({
      ...normalizedSource,
      title: first.title,
      message: first.message,
      type: first.type ?? NotificationType.SYSTEM,
      level: first.level ?? NotificationLevel.INFO,
      data: this.stringData(first.data),
      recipients,
    })
  }

  async enqueueStudentAndParents(
    input: EnqueueStudentBusinessNotificationsInput,
  ): Promise<EnqueueNotificationDispatchJobResult | null> {
    if (input.targets.length === 0) return null
    try {
      const resolved = await this.unitOfWork.executeInTransaction(async (repos) => {
        const [students, parents] = await Promise.all([
          repos.notificationDispatchRecipientRepository.resolveSnapshots(
            input.targets.flatMap((target) => target.studentUserId ? [target.studentUserId] : []),
          ),
          repos.notificationDispatchRecipientRepository.resolveParentTargetsByStudentIds(
            input.targets.map((target) => target.studentId),
          ),
        ])
        return { students, parents }
      })
      const studentByUserId = new Map(resolved.students.map((item) => [item.userId, item]))
      const parentsByStudentId = this.groupParents(resolved.parents)
      const recipients: NotificationDispatchRecipientCommand[] = []
      const zaloByDestination = new Map<string, { target: StudentBusinessNotificationTarget; payloads: NotificationDeliveryPayload[] }>()

      input.targets.forEach((target, index) => {
        if (target.studentPayload && target.studentUserId) {
          const student = studentByUserId.get(target.studentUserId)
          if (student) {
            recipients.push(this.userCommand(student, `USER:${student.userId}:STUDENT:${target.studentId}:${index}`, [
              { channel: NotificationDeliveryChannel.IN_APP, payload: target.studentPayload },
            ], target.studentId))
          }
        }
        if (target.parentPayload) {
          for (const parent of parentsByStudentId.get(target.studentId) ?? []) {
            recipients.push(this.userCommand(parent, `USER:${parent.userId}:STUDENT:${target.studentId}:${index}`, [
              { channel: NotificationDeliveryChannel.IN_APP, payload: target.parentPayload },
              { channel: NotificationDeliveryChannel.PUSH, payload: target.parentPayload },
            ], target.studentId))
          }
        }
        if (target.zaloPayload) {
          const destination = target.parentZaloId?.trim() || `MISSING:${target.studentId}`
          const grouped = zaloByDestination.get(destination)
          if (grouped) grouped.payloads.push(target.zaloPayload)
          else zaloByDestination.set(destination, { target, payloads: [target.zaloPayload] })
        }
      })

      for (const [destinationKey, grouped] of zaloByDestination) {
        const destination = destinationKey.startsWith('MISSING:') ? undefined : destinationKey
        const payload = this.mergePayloads(grouped.payloads)
        recipients.push({
          recipientKey: `ZALO:${destinationKey}`,
          recipientKind: NotificationRecipientKind.EXTERNAL_CONTACT,
          recipientType: NotificationRecipientType.PARENT,
          sourceStudentId: grouped.target.studentId,
          displayName: 'Phụ huynh (Zalo OA)',
          phone: destination,
          deliveries: [{
            channel: NotificationDeliveryChannel.ZALO_OA,
            payload,
            destination,
            providerAppId: grouped.target.zaloAppId,
            maxAttempts: 3,
          }],
        })
      }

      return this.safeEnqueue({ ...input, recipients })
    } catch (error) {
      this.logEnqueueFailure(input, error)
      return null
    }
  }

  private async safeEnqueue(input: EnqueueBusinessJobInput): Promise<EnqueueNotificationDispatchJobResult | null> {
    if (input.recipients.length === 0) return null
    try {
      return await this.enqueueJob.execute({
        idempotencyKey: input.idempotencyKey,
        requestFingerprint: this.fingerprint(input.recipients),
        recipients: input.recipients,
        title: input.title,
        message: input.message,
        type: input.type ?? NotificationType.SYSTEM,
        level: input.level ?? NotificationLevel.INFO,
        data: input.data,
        audienceType: NotificationAudienceType.SPECIFIC_USERS,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceEvent: input.sourceEvent,
      })
    } catch (error) {
      this.logEnqueueFailure(input, error)
      return null
    }
  }

  private async safeResolveUsers(
    userIds: number[],
    source?: Partial<BusinessNotificationSource>,
  ): Promise<NotificationRecipientSnapshot[] | null> {
    try {
      return await this.unitOfWork.executeInTransaction((repos) =>
        repos.notificationDispatchRecipientRepository.resolveSnapshots(Array.from(new Set(userIds))),
      )
    } catch (error) {
      this.logEnqueueFailure(source ?? {}, error)
      return null
    }
  }

  private userCommand(
    snapshot: NotificationRecipientSnapshot,
    recipientKey: string,
    deliveries: NotificationDispatchRecipientCommand['deliveries'],
    sourceStudentId?: number,
  ): NotificationDispatchRecipientCommand {
    return {
      recipientKey,
      recipientKind: NotificationRecipientKind.USER,
      recipientType: snapshot.recipientType,
      userId: snapshot.userId,
      profileId: snapshot.profileId,
      sourceStudentId,
      displayName: snapshot.displayName,
      email: snapshot.email,
      phone: snapshot.phone,
      deliveries,
    }
  }

  private payload(data: CreateNotificationData): NotificationDeliveryPayload {
    return {
      title: data.title,
      message: data.message,
      type: data.type ?? NotificationType.SYSTEM,
      level: data.level ?? NotificationLevel.INFO,
      data: this.stringData(data.data),
    }
  }

  private mergePayloads(payloads: NotificationDeliveryPayload[]): NotificationDeliveryPayload {
    if (payloads.length === 1) return payloads[0]
    return { ...payloads[0], message: payloads.map((item) => item.message).join('\n\n---\n\n') }
  }

  private groupParents(parents: NotificationParentTarget[]): Map<number, NotificationParentTarget[]> {
    const result = new Map<number, NotificationParentTarget[]>()
    for (const parent of parents) result.set(parent.studentId, [...(result.get(parent.studentId) ?? []), parent])
    return result
  }

  private sourceOrLegacy(
    source: Partial<BusinessNotificationSource> | undefined,
    notifications: CreateNotificationData[],
  ): BusinessNotificationSource {
    const fingerprint = this.fingerprint(notifications)
    return {
      sourceType: source?.sourceType ?? 'LEGACY_NOTIFICATION',
      sourceId: source?.sourceId ?? fingerprint.slice(0, 24),
      sourceEvent: source?.sourceEvent ?? 'CREATE',
      idempotencyKey: source?.idempotencyKey ?? `legacy:${fingerprint}`,
    }
  }

  private fingerprint(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(this.canonicalize(value))).digest('hex')
  }

  private canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.canonicalize(item))
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, this.canonicalize(item)]))
    }
    return value
  }

  private stringData(data?: Record<string, unknown>): Record<string, string> | undefined {
    if (!data) return undefined
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]))
  }

  private logEnqueueFailure(source: Partial<BusinessNotificationSource>, error: unknown): void {
    this.logger.error({
      event: 'notification_enqueue_failed',
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      sourceEvent: source.sourceEvent,
      idempotencyKey: source.idempotencyKey,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

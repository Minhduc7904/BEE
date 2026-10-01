import { Inject, Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import type { BusinessNotificationOutbox } from '../../../domain/entities/notification'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
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
import { NotificationDeliveryChannelPolicyService } from './notification-delivery-channel-policy.service'

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
  data?: Record<string, unknown>
  targets: StudentBusinessNotificationTarget[]
}

export interface EnqueueBusinessJobInput extends BusinessNotificationSource {
  title: string
  message: string
  type?: NotificationType
  level?: NotificationLevel
  data?: Record<string, unknown>
  recipients: NotificationDispatchRecipientCommand[]
}

@Injectable()
export class BusinessNotificationQueueService {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly enqueueJob: EnqueueNotificationDispatchJobUseCase,
    private readonly channelPolicy: NotificationDeliveryChannelPolicyService,
  ) {}

  async enqueueInApp(
    notifications: CreateNotificationData[],
    source?: Partial<BusinessNotificationSource>,
  ): Promise<BusinessNotificationOutbox | null> {
    return this.unitOfWork.executeInTransaction((repos) => this.enqueueInAppWithRepos(repos, notifications, source))
  }

  async enqueueInAppWithRepos(
    repos: UnitOfWorkRepos,
    notifications: CreateNotificationData[],
    source?: Partial<BusinessNotificationSource>,
  ): Promise<BusinessNotificationOutbox | null> {
    if (notifications.length === 0) return null
    const snapshots = await repos.notificationDispatchRecipientRepository.resolveSnapshots(
      Array.from(new Set(notifications.map((item) => item.userId))),
    )
    const snapshotByUserId = new Map(snapshots.map((item) => [item.userId, item]))
    const recipients = notifications.flatMap((item, index) => {
      const snapshot = snapshotByUserId.get(item.userId)
      if (!snapshot) return []
      return [
        this.userCommand(snapshot, `USER:${item.userId}:${index}`, [
          { channel: NotificationDeliveryChannel.IN_APP, payload: this.payload(item) },
        ]),
      ]
    })
    const first = notifications[0]
    const normalizedSource = this.sourceOrLegacy(source, notifications)
    return this.persist(repos, {
      ...normalizedSource,
      title: first.title,
      message: first.message,
      type: first.type ?? NotificationType.SYSTEM,
      level: first.level ?? NotificationLevel.INFO,
      data: first.data,
      recipients,
    })
  }

  async enqueueStudentAndParents(
    input: EnqueueStudentBusinessNotificationsInput,
  ): Promise<BusinessNotificationOutbox | null> {
    return this.unitOfWork.executeInTransaction((repos) => this.enqueueStudentAndParentsWithRepos(repos, input))
  }

  async enqueueStudentAndParentsWithRepos(
    repos: UnitOfWorkRepos,
    input: EnqueueStudentBusinessNotificationsInput,
  ): Promise<BusinessNotificationOutbox | null> {
    if (input.targets.length === 0) return null
    const [students, parents] = await Promise.all([
      repos.notificationDispatchRecipientRepository.resolveSnapshots(
        input.targets.flatMap((target) => (target.studentUserId ? [target.studentUserId] : [])),
      ),
      repos.notificationDispatchRecipientRepository.resolveParentTargetsByStudentIds(
        input.targets.map((target) => target.studentId),
      ),
    ])
    const resolved = { students, parents }
    const studentByUserId = new Map(resolved.students.map((item) => [item.userId, item]))
    const parentsByStudentId = this.groupParents(resolved.parents)
    const recipients: NotificationDispatchRecipientCommand[] = []
    const zaloByDestination = new Map<
      string,
      { target: StudentBusinessNotificationTarget; payloads: NotificationDeliveryPayload[] }
    >()

    input.targets.forEach((target, index) => {
      if (target.studentPayload && target.studentUserId) {
        const student = studentByUserId.get(target.studentUserId)
        if (student) {
          recipients.push(
            this.userCommand(
              student,
              `USER:${student.userId}:STUDENT:${target.studentId}:${index}`,
              [{ channel: NotificationDeliveryChannel.IN_APP, payload: target.studentPayload }],
              target.studentId,
            ),
          )
        }
      }
      if (target.parentPayload) {
        for (const parent of parentsByStudentId.get(target.studentId) ?? []) {
          const deliveries = this.channelPolicy.enabledInAppChannels().map((channel) => ({
            channel,
            payload: target.parentPayload!,
          }))
          recipients.push(
            this.userCommand(
              parent,
              `USER:${parent.userId}:STUDENT:${target.studentId}:${index}`,
              deliveries,
              target.studentId,
            ),
          )
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
        deliveries: [
          {
            channel: NotificationDeliveryChannel.ZALO_OA,
            payload,
            destination,
            providerAppId: grouped.target.zaloAppId,
            maxAttempts: 3,
          },
        ],
      })
    }

    return this.persist(repos, { ...input, recipients })
  }

  async publishOutbox(input: EnqueueBusinessJobInput): Promise<EnqueueNotificationDispatchJobResult | null> {
    if (input.recipients.length === 0) return null
    return this.enqueueJob.execute({
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
  }

  private persist(repos: UnitOfWorkRepos, input: EnqueueBusinessJobInput): Promise<BusinessNotificationOutbox | null> {
    if (input.recipients.length === 0) return Promise.resolve(null)
    return repos.businessNotificationOutboxRepository.createOrGet({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceEvent: input.sourceEvent,
      idempotencyKey: input.idempotencyKey,
      payload: input as unknown as Record<string, unknown>,
    })
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
      data: data.data,
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
    return createHash('sha256')
      .update(JSON.stringify(this.canonicalize(value)))
      .digest('hex')
  }

  private canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.canonicalize(item))
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.canonicalize(item)]),
      )
    }
    return value
  }
}

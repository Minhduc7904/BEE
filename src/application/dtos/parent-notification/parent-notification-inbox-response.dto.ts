import type {
  ParentNotificationInboxItem,
  ParentNotificationInboxStats,
} from '../../interfaces/parent-notification-inbox.interface'
import { NotificationDestinationType, NotificationLevel, NotificationType } from '../../../shared/enums'

export class ParentNotificationDestinationDto {
  type: NotificationDestinationType
  resourceId: number

  constructor(type: NotificationDestinationType, resourceId: number) {
    this.type = type
    this.resourceId = resourceId
  }
}

export class ParentNotificationInboxItemDto {
  notificationId: number
  studentId: number | null
  title: string
  message: string
  type: NotificationType
  level: NotificationLevel
  isRead: boolean
  readAt: Date | null
  createdAt: Date
  destination: ParentNotificationDestinationDto | null

  static fromItem(item: ParentNotificationInboxItem): ParentNotificationInboxItemDto {
    return {
      notificationId: item.notificationId,
      studentId: item.sourceStudentId,
      title: item.title,
      message: item.message,
      type: item.type,
      level: item.level,
      isRead: item.isRead,
      readAt: item.readAt,
      createdAt: item.createdAt,
      destination: resolveParentNotificationDestination(item.data),
    }
  }
}

export class ParentNotificationStatsResponseDto {
  total: number
  unread: number
  read: number

  static fromStats(stats: ParentNotificationInboxStats): ParentNotificationStatsResponseDto {
    return { ...stats }
  }
}

const supportedDestinationTypes = new Set<string>(Object.values(NotificationDestinationType))

export function resolveParentNotificationDestination(
  data: Record<string, unknown> | null,
): ParentNotificationDestinationDto | null {
  if (!data) return null

  const canonicalType = typeof data.destinationType === 'string' ? data.destinationType : null
  const canonicalId = positiveInteger(data.resourceId)
  if (canonicalType && supportedDestinationTypes.has(canonicalType) && canonicalId) {
    return new ParentNotificationDestinationDto(canonicalType as NotificationDestinationType, canonicalId)
  }

  const legacyMappings: Array<[NotificationDestinationType, unknown]> = [
    [NotificationDestinationType.ATTENDANCE_RECORD, data.attendanceId],
    [NotificationDestinationType.TUITION_PAYMENT, data.paymentId ?? data.invoiceId],
    [NotificationDestinationType.HOMEWORK_RESULT, data.homeworkSubmitId],
    [NotificationDestinationType.EXAM_RESULT, data.competitionSubmitId],
    [NotificationDestinationType.SCHEDULE_SESSION, data.sessionId],
    [NotificationDestinationType.NOTIFICATION, data.notificationId],
  ]
  for (const [type, rawId] of legacyMappings) {
    const resourceId = positiveInteger(rawId)
    if (resourceId) return new ParentNotificationDestinationDto(type, resourceId)
  }
  return null
}

function positiveInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' || typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

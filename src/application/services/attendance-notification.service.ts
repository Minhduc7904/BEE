import { Injectable } from '@nestjs/common'
import type { UnitOfWorkRepos } from '../../domain/repositories'
import type { Attendance } from '../../domain/entities/attendance/attendance.entity'
import type { ClassSession } from '../../domain/entities/class-session/class-session.entity'
import type { ClassSessionNotificationMoment } from '../../domain/interface/class-session/class-session.interface'
import type { NotificationDeliveryPayload } from '../../domain/interface/notification-dispatch'
import {
  AttendanceStatusLabels,
  AttendanceType,
  NotificationDestinationType,
  NotificationLevel,
  NotificationType,
} from '../../shared/enums'
import { formatVnDate, formatVnTime } from '../../shared/utils/vietnam-date.util'
import {
  AttendanceSessionNotificationTemplate,
  type AttendanceSessionNotificationContent,
  type AttendanceSessionNotificationData,
} from '../../infrastructure/templates/attendance-session-notification.template'
import {
  BusinessNotificationQueueService,
  type StudentBusinessNotificationTarget,
} from '../use-cases/notification/business-notification-queue.service'
import { getSessionNotificationMoments } from '../use-cases/class-session/class-session-time.helper'

/** Sự kiện thông báo theo từng bản ghi điểm danh (chỉ gửi phụ huynh). */
export type AttendanceNotificationEvent = 'ARRIVED' | 'STATUS_CHANGED'

const DEFAULT_ZALO_APP_ID = '443601004373365149'

/**
 * Xếp hàng thông báo điểm danh (in-app + push + Zalo OA) qua outbox nghiệp vụ.
 * Việc gửi thật do relay/dispatcher đảm nhiệm; cài đặt `attendanceEnabled` của phụ huynh vẫn do dispatcher xử lý.
 */
@Injectable()
export class AttendanceNotificationService {
  constructor(private readonly queue: BusinessNotificationQueueService) {}

  /**
   * Gửi thông báo theo mốc buổi học cho danh sách học sinh vắng chưa học bù.
   * Phụ huynh (in-app + push + Zalo) và học sinh (in-app) cùng nhận.
   * @returns số học sinh đã xếp hàng (0 nếu không có ai hoặc outbox không tạo được)
   */
  async enqueueSessionMoment(
    repos: UnitOfWorkRepos,
    session: ClassSession,
    moment: ClassSessionNotificationMoment,
    attendances: Attendance[],
  ): Promise<number> {
    if (attendances.length === 0) return 0

    const moments = getSessionNotificationMoments(session)
    const momentAt = moment === 'ABSENT_REMINDER' ? moments.reminderAt : moments.summaryAt
    const appId = process.env.ZALO_APP_ID || DEFAULT_ZALO_APP_ID

    const targets: StudentBusinessNotificationTarget[] = attendances.map((attendance) => {
      const base = this.buildBaseData(attendance, session)
      const content: AttendanceSessionNotificationContent =
        moment === 'ABSENT_REMINDER'
          ? AttendanceSessionNotificationTemplate.renderNotArrived({
              ...base,
              reminderTime: formatVnTime(moments.reminderAt),
            })
          : AttendanceSessionNotificationTemplate.renderAbsent({ ...base, makeupNote: session.makeupNote })
      const data = {
        attendanceId: String(attendance.attendanceId),
        sessionId: String(session.sessionId),
        studentId: String(attendance.studentId),
        status: attendance.status,
        attendanceType: attendance.attendanceType,
        event: moment,
        destinationType: NotificationDestinationType.SCHEDULE_SESSION,
        resourceId: Number(session.sessionId),
      }
      const parentPayload = this.payload(content.title, content.parentMessage, data)

      return {
        studentId: attendance.studentId,
        studentUserId: attendance.student?.userId,
        studentPayload: this.payload(content.title, content.studentMessage, data),
        parentPayload,
        parentZaloId: attendance.student?.parentZaloId,
        zaloPayload: parentPayload,
        zaloAppId: appId,
      }
    })

    const queued = await this.queue.enqueueStudentAndParentsWithRepos(repos, {
      idempotencyKey: `class-session:${session.sessionId}:${moment}:${momentAt.toISOString()}`,
      sourceType: 'CLASS_SESSION',
      sourceId: String(session.sessionId),
      sourceEvent: moment,
      title: 'Thông báo điểm danh',
      message: `Thông báo điểm danh cho ${targets.length} học sinh`,
      type: NotificationType.ATTENDANCE,
      level: NotificationLevel.INFO,
      data: { sessionId: String(session.sessionId), moment },
      targets,
    })

    return queued ? targets.length : 0
  }

  /**
   * Gửi thông báo cho phụ huynh khi một bản ghi điểm danh vừa chuyển sang Có mặt (`ARRIVED`)
   * hoặc bị hủy điểm danh (`STATUS_CHANGED`). Học sinh đã có thông báo in-app riêng từ use case nên không gửi lại.
   * `attendance` cần kèm `student` (user) và `classSession` (courseClass).
   * @returns `true` khi đã xếp hàng
   */
  async enqueueAttendanceEvent(
    repos: UnitOfWorkRepos,
    attendance: Attendance,
    event: AttendanceNotificationEvent,
  ): Promise<boolean> {
    const session = attendance.classSession
    if (!session) return false

    const base = this.buildBaseData(attendance, session)
    const content =
      event === 'ARRIVED'
        ? AttendanceSessionNotificationTemplate.renderArrived({
            ...base,
            markedAt: formatVnTime(attendance.markedAt),
            isMakeup: attendance.attendanceType === AttendanceType.MAKEUP,
          })
        : AttendanceSessionNotificationTemplate.renderStatusChanged({
            ...base,
            statusLabel: AttendanceStatusLabels[attendance.status] || attendance.status,
          })
    const payload = this.payload(content.title, content.parentMessage, {
      attendanceId: String(attendance.attendanceId),
      sessionId: String(attendance.sessionId),
      studentId: String(attendance.studentId),
      status: attendance.status,
      attendanceType: attendance.attendanceType,
      event,
      destinationType: NotificationDestinationType.SCHEDULE_SESSION,
      resourceId: Number(attendance.sessionId),
    })

    const queued = await this.queue.enqueueStudentAndParentsWithRepos(repos, {
      idempotencyKey: `attendance:${attendance.attendanceId}:${event}:${attendance.markedAt.getTime()}`,
      sourceType: 'ATTENDANCE',
      sourceId: String(attendance.attendanceId),
      sourceEvent: event,
      title: payload.title,
      message: payload.message,
      type: NotificationType.ATTENDANCE,
      level: NotificationLevel.INFO,
      data: payload.data,
      targets: [
        {
          studentId: attendance.studentId,
          parentPayload: payload,
          parentZaloId: attendance.student?.parentZaloId,
          zaloPayload: payload,
          zaloAppId: process.env.ZALO_APP_ID || DEFAULT_ZALO_APP_ID,
        },
      ],
    })

    return Boolean(queued)
  }

  private buildBaseData(attendance: Attendance, session: ClassSession): AttendanceSessionNotificationData {
    const user = attendance.student?.user
    const studentName = user ? `${user.lastName || ''} ${user.firstName || ''}`.trim() : ''
    return {
      studentName: studentName || `#${attendance.studentId}`,
      className: session.courseClass?.className || 'N/A',
      sessionName: session.name,
      sessionDate: formatVnDate(session.sessionDate),
      sessionTime: `${formatVnTime(session.startTime)} - ${formatVnTime(session.endTime)}`,
    }
  }

  private payload(title: string, message: string, data: Record<string, unknown>): NotificationDeliveryPayload {
    return {
      title,
      message,
      type: NotificationType.ATTENDANCE,
      level: NotificationLevel.INFO,
      data,
    }
  }
}

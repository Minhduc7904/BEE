import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { ClassSession } from '../../../domain/entities/class-session/class-session.entity'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BackgroundJobCode, BackgroundJobRunStatus } from '../../../shared/enums'
import { AttendanceNotificationService } from '../../services/attendance-notification.service'
import { resolveVietnamToday } from '../parent-student-schedule/parent-student-schedule-week'
import { getSessionNotificationMoments } from '../class-session/class-session-time.helper'

const JOB_CONFIG = {
  code: BackgroundJobCode.ATTENDANCE_SESSION_NOTIFIER,
  displayName: 'Thông báo điểm danh theo mốc buổi học',
  cronExpression: '0 * * * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  isEnabled: true,
  maxRuntimeSeconds: 120,
} as const

export interface SessionAttendanceNotificationsRunResult {
  backgroundJobRunId: number
  /** Số buổi có ít nhất một mốc được xử lý. */
  sessions: number
  /** Số buổi đã xử lý mốc start + 15 phút (có gửi tin). */
  reminders: number
  /** Số buổi đã xử lý mốc hết giờ (có gửi tin). */
  summaries: number
  /** Tổng số học sinh được xếp hàng thông báo. */
  recipients: number
  /** Số buổi bị lỗi (đã rollback, sẽ thử lại ở lần quét kế tiếp). */
  failed: number
}

/**
 * Quét mỗi phút các buổi học của hôm nay (giờ VN) để gửi thông báo điểm danh theo hai mốc:
 * - start + 15 phút: "con chưa đến lớp" cho học sinh còn ABSENT chưa học bù.
 * - hết giờ: "con hôm nay vắng" cho học sinh còn ABSENT chưa học bù (tính tại thời điểm chạy).
 *
 * Mỗi mốc chỉ gửi một lần mỗi buổi nhờ cập nhật có điều kiện cột dấu. Mốc đã qua mà chưa gửi sẽ được gửi bù
 * trong ngày; nếu đã qua cả hai mốc mà chưa gửi lần nào thì chỉ gửi tin vắng và đánh dấu luôn mốc 15 phút.
 * Buổi của các ngày trước không bị quét.
 */
@Injectable()
export class SendSessionAttendanceNotificationsUseCase {
  private readonly logger = new Logger(SendSessionAttendanceNotificationsUseCase.name)

  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly attendanceNotificationService: AttendanceNotificationService,
  ) {}

  async executeScheduled(workerId: string): Promise<SessionAttendanceNotificationsRunResult | null> {
    // Kiểm tra rẻ trước khi upsert/lock/ghi run: không có mốc nào đến hạn thì bỏ qua để không tạo ~1440 run/ngày
    if (!(await this.hasDue(new Date()))) return null

    const job = await this.unitOfWork.executeInTransaction((repos) => repos.backgroundJobRepository.upsert(JOB_CONFIG))
    if (!job.canRun()) return null
    const execution = await this.acquireExecution(job.backgroundJobId, job.maxRuntimeSeconds, workerId)
    if (!execution) throw new ConflictException('ATTENDANCE_SESSION_NOTIFIER_ALREADY_RUNNING')

    const result = { sessions: 0, reminders: 0, summaries: 0, recipients: 0, failed: 0 }
    try {
      const now = new Date()
      const today = resolveVietnamToday(now)
      const sessions = await this.unitOfWork.executeInTransaction((repos) =>
        repos.classSessionRepository.findForAttendanceNotification(today),
      )

      for (const session of sessions) {
        try {
          const outcome = await this.processSession(session, now)
          if (outcome.processed) result.sessions += 1
          if (outcome.reminderSent) result.reminders += 1
          if (outcome.summarySent) result.summaries += 1
          result.recipients += outcome.recipients
        } catch (error) {
          result.failed += 1
          const message = error instanceof Error ? error.message : String(error)
          this.logger.warn(`Thông báo điểm danh buổi #${session.sessionId} thất bại: ${message}`)
        }
      }

      await this.unitOfWork.executeInTransaction((repos) =>
        repos.backgroundJobRunRepository.update(execution.backgroundJobRunId, {
          status: BackgroundJobRunStatus.SUCCEEDED,
          finishedAt: new Date(),
          resultSummary: result,
        }),
      )
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

  private async hasDue(now: Date): Promise<boolean> {
    const sessions = await this.unitOfWork.executeInTransaction((repos) =>
      repos.classSessionRepository.findForAttendanceNotification(resolveVietnamToday(now)),
    )
    return sessions.some((session) => {
      const moments = getSessionNotificationMoments(session)
      return (
        (!session.absentReminderNotifiedAt && now >= moments.reminderAt) ||
        (!session.absenceSummaryNotifiedAt && now >= moments.summaryAt)
      )
    })
  }

  /** Xử lý các mốc đến hạn của một buổi trong một transaction riêng (lỗi thì rollback cả claim lẫn outbox). */
  private async processSession(
    session: ClassSession,
    now: Date,
  ): Promise<{ processed: boolean; reminderSent: boolean; summarySent: boolean; recipients: number }> {
    const moments = getSessionNotificationMoments(session)
    const reminderDue = !session.absentReminderNotifiedAt && now >= moments.reminderAt
    const summaryDue = !session.absenceSummaryNotifiedAt && now >= moments.summaryAt
    if (!reminderDue && !summaryDue) {
      return { processed: false, reminderSent: false, summarySent: false, recipients: 0 }
    }

    return this.unitOfWork.executeInTransaction(async (repos) => {
      const sessionRepository = repos.classSessionRepository
      let claimedReminder = false
      let claimedSummary = false

      // Qua cả hai mốc mà chưa gửi lần nào: claim cả hai nhưng chỉ gửi tin vắng
      if (reminderDue) {
        claimedReminder = await sessionRepository.claimNotificationMoment(session.sessionId, 'ABSENT_REMINDER', now)
      }
      if (summaryDue) {
        claimedSummary = await sessionRepository.claimNotificationMoment(session.sessionId, 'ABSENCE_SUMMARY', now)
      }

      const sendSummary = claimedSummary
      const sendReminder = claimedReminder && !summaryDue
      if (!sendSummary && !sendReminder) {
        return { processed: false, reminderSent: false, summarySent: false, recipients: 0 }
      }

      const absences = await repos.attendanceRepository.findUnmadeUpAbsencesBySession(session.sessionId)
      let recipients = 0
      if (absences.length > 0) {
        recipients = await this.attendanceNotificationService.enqueueSessionMoment(
          repos,
          session,
          sendSummary ? 'ABSENCE_SUMMARY' : 'ABSENT_REMINDER',
          absences,
        )
      }

      return { processed: true, reminderSent: sendReminder, summarySent: sendSummary, recipients }
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

  private async failExecution(backgroundJobRunId: number, error: unknown): Promise<void> {
    await this.unitOfWork.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.FAILED,
        finishedAt: new Date(),
        errorCode: 'ATTENDANCE_SESSION_NOTIFIER_FAILED',
        errorMessage: error instanceof Error ? error.message.slice(0, 1_000) : 'Lỗi thông báo điểm danh không xác định',
      }),
    )
  }
}

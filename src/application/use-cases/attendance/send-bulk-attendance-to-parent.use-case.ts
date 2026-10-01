import { Inject, Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import { AttendanceParentMessageTemplate } from 'src/infrastructure/templates/attendance-parent-message.template'
import { AttendanceStatus, AttendanceStatusLabels, NotificationLevel, NotificationType } from 'src/shared/enums'
import { formatVnDate, formatVnDateTime, formatVnTime } from 'src/shared/utils/vietnam-date.util'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { BusinessNotificationQueueService } from '../notification/business-notification-queue.service'

interface SendBulkAttendanceToParentInput {
  attendanceIds: number[]
  appId?: string
  note?: string
  concurrency?: number
  includeZalo?: boolean
}

interface SendBulkAttendanceToParentResult {
  requestedCount: number
  sentCount: number
  failedCount: number
}

interface AttendanceNotificationJob {
  attendanceId: number
  studentId: number
  parentZaloId: string | undefined
  messageText: string
}

@Injectable()
export class SendBulkAttendanceToParentUseCase {
  private static readonly DEFAULT_APP_ID = '443601004373365149'

  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly queue: BusinessNotificationQueueService,
  ) {}

  async execute(input: SendBulkAttendanceToParentInput): Promise<SendBulkAttendanceToParentResult> {
    return this.unitOfWork.executeInTransaction((repos) => this.executeWithRepos(repos, input))
  }

  async executeWithRepos(
    repos: UnitOfWorkRepos,
    input: SendBulkAttendanceToParentInput,
  ): Promise<SendBulkAttendanceToParentResult> {
    const uniqueAttendanceIds = [...new Set(input.attendanceIds)].filter(
      (attendanceId) => Number.isInteger(attendanceId) && attendanceId > 0,
    )

    if (uniqueAttendanceIds.length === 0) {
      return {
        requestedCount: 0,
        sentCount: 0,
        failedCount: 0,
      }
    }

    const appId = input.appId || process.env.ZALO_APP_ID || SendBulkAttendanceToParentUseCase.DEFAULT_APP_ID
    const jobs = await this.buildJobs(repos, uniqueAttendanceIds, input.note)
    if (jobs.length === 0) {
      return {
        requestedCount: uniqueAttendanceIds.length,
        sentCount: 0,
        failedCount: uniqueAttendanceIds.length,
      }
    }

    const digest = createHash('sha256')
      .update(
        jobs
          .map((job) => `${job.attendanceId}:${job.messageText}`)
          .sort()
          .join('|'),
      )
      .digest('hex')
      .slice(0, 24)
    const queued = await this.queue.enqueueStudentAndParentsWithRepos(repos, {
      idempotencyKey: `attendance-bulk:${digest}`,
      sourceType: 'ATTENDANCE',
      sourceId: `bulk:${digest}`,
      sourceEvent: 'BULK_PARENT_NOTIFY',
      title: 'Thông báo điểm danh',
      message: `Thông báo điểm danh cho ${jobs.length} học sinh`,
      type: NotificationType.ATTENDANCE,
      level: NotificationLevel.INFO,
      targets: jobs.map((job) => {
        const payload = {
          title: 'Thông báo điểm danh',
          message: job.messageText,
          type: NotificationType.ATTENDANCE,
          level: NotificationLevel.INFO,
          data: { attendanceId: String(job.attendanceId), studentId: String(job.studentId) },
        }
        return {
          studentId: job.studentId,
          parentPayload: payload,
          parentZaloId: job.parentZaloId,
          zaloPayload: input.includeZalo === false ? undefined : payload,
          zaloAppId: appId,
        }
      }),
    })
    return {
      requestedCount: uniqueAttendanceIds.length,
      sentCount: queued ? jobs.length : 0,
      failedCount: queued ? uniqueAttendanceIds.length - jobs.length : uniqueAttendanceIds.length,
    }
  }

  private async buildJobs(
    repos: UnitOfWorkRepos,
    attendanceIds: number[],
    note?: string,
  ): Promise<AttendanceNotificationJob[]> {
    const attendances = await Promise.all(
      attendanceIds.map((attendanceId) => repos.attendanceRepository.findById(attendanceId)),
    )

    const jobs = await Promise.all(
      attendances
        .filter((attendance): attendance is NonNullable<typeof attendance> => Boolean(attendance))
        .map(async (attendance) => {
          const parentZaloId = attendance.student?.parentZaloId || undefined

          const studentName = attendance.student?.user
            ? `${attendance.student.user.lastName || ''} ${attendance.student.user.firstName || ''}`.trim()
            : `#${attendance.studentId}`

          const className = attendance.classSession?.courseClass?.className || 'N/A'
          const sessionDate = attendance.classSession?.sessionDate
            ? formatVnDate(attendance.classSession.sessionDate)
            : 'N/A'

          const sessionTime =
            attendance.classSession?.startTime && attendance.classSession?.endTime
              ? `${formatVnTime(attendance.classSession.startTime)} - ${formatVnTime(attendance.classSession.endTime)}`
              : ''

          const arrivalTime = attendance.markedAt ? formatVnDateTime(attendance.markedAt) : 'Chưa có dữ liệu'

          const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
          const attendanceTimeLabel =
            attendance.status === AttendanceStatus.ABSENT ? '⏰ THỜI GIAN ĐIỂM DANH' : '⏰ THỜI GIAN ĐẾN LỚP'

          const makeupLine =
            attendance.status === AttendanceStatus.ABSENT && attendance.classSession?.makeupNote
              ? `🔁 LỊCH HỌC BÙ: ${attendance.classSession.makeupNote}`
              : ''

          const homeworkLine = await this.buildHomeworkLine(attendance, repos)

          return {
            attendanceId: attendance.attendanceId,
            studentId: attendance.studentId,
            parentZaloId,
            messageText: AttendanceParentMessageTemplate.render({
              studentName,
              className,
              sessionDate,
              sessionTime,
              attendanceTimeLabel,
              arrivalTime,
              statusLabel,
              makeupLine,
              homeworkLine,
              notes: attendance.notes || undefined,
              note,
            }),
          }
        }),
    )

    return jobs.filter((job): job is AttendanceNotificationJob => Boolean(job))
  }

  private async buildHomeworkLine(attendance: any, repos: any): Promise<string> {
    if (attendance.status === AttendanceStatus.ABSENT) {
      return ''
    }

    const studentId = attendance.studentId ?? attendance.student?.studentId
    const homeworkId = attendance.classSession?.homeworkId
    if (typeof homeworkId !== 'number' || !studentId) {
      return '📚 BTVN: Buổi học này chưa có bài tập về nhà'
    }

    const homeworkSubmit = await repos.homeworkSubmitRepository.findByHomeworkAndStudent(homeworkId, studentId)

    if (!homeworkSubmit) {
      return '📚 BTVN: Chưa nộp'
    }

    const pts = homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points
    const maxPts = homeworkSubmit.competitionSubmit?.maxPoints

    const pointsText =
      pts === null || pts === undefined
        ? ''
        : homeworkSubmit.competitionSubmitId && maxPts != null
          ? ` | 🎯 ${pts}/${maxPts}`
          : ` | 🎯 ${pts}`

    const feedbackText = homeworkSubmit.feedback ? `\n💬 NHẬN XÉT: ${homeworkSubmit.feedback}` : ''

    return `📚 BTVN: Đã nộp lúc ${formatVnDateTime(homeworkSubmit.submitAt)}${pointsText}${feedbackText}`
  }
}

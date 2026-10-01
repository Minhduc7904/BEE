import { Inject, Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { AttendanceStatusLabels, AttendanceStatus, NotificationLevel, NotificationType } from 'src/shared/enums'
import { formatVnDate, formatVnDateTime, formatVnTime } from 'src/shared/utils/vietnam-date.util'
import { AttendanceParentMessageTemplate } from 'src/infrastructure/templates/attendance-parent-message.template'
import { BusinessNotificationQueueService } from '../notification/business-notification-queue.service'

interface SendAttendanceToParentInput {
  attendanceId: number
  appId?: string
  note?: string
  includeZalo?: boolean
}

export interface SendAttendanceToParentResult {
  sent: boolean
  messageText: string
  errorMessage?: string
}

@Injectable()
export class SendAttendanceToParentUseCase {
  private static readonly DEFAULT_APP_ID = '443601004373365149'

  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly queue: BusinessNotificationQueueService,
  ) {}

  async execute(input: SendAttendanceToParentInput): Promise<SendAttendanceToParentResult> {
    return this.unitOfWork.executeInTransaction((repos) => this.executeWithRepos(repos, input))
  }

  async executeWithRepos(
    repos: UnitOfWorkRepos,
    input: SendAttendanceToParentInput,
  ): Promise<SendAttendanceToParentResult> {
    const appId = input.appId || process.env.ZALO_APP_ID || SendAttendanceToParentUseCase.DEFAULT_APP_ID

    const attendance = await repos.attendanceRepository.findById(input.attendanceId)

    if (!attendance) {
      return {
        sent: false,
        messageText: '',
        errorMessage: 'Không tìm thấy phiếu điểm danh',
      }
    }

    const studentName = attendance.student?.user
      ? `${attendance.student.user.lastName || ''} ${attendance.student.user.firstName || ''}`.trim()
      : `#${attendance.studentId}`

    const className = attendance.classSession?.courseClass?.className || 'N/A'

    const sessionDate = attendance.classSession?.sessionDate ? formatVnDate(attendance.classSession.sessionDate) : 'N/A'

    const sessionTime =
      attendance.classSession?.startTime && attendance.classSession?.endTime
        ? `${formatVnTime(attendance.classSession.startTime)} - ${formatVnTime(attendance.classSession.endTime)}`
        : ''

    const arrivalTime = attendance.markedAt ? formatVnDateTime(attendance.markedAt) : 'Chưa có dữ liệu'

    const studentId = attendance.studentId ?? attendance.student?.studentId
    const homeworkId = attendance.classSession?.homeworkId

    let homeworkLine = ''
    if (attendance.status !== AttendanceStatus.ABSENT) {
      homeworkLine = '📚 BTVN: Buổi học này chưa có bài tập về nhà'

      if (typeof homeworkId === 'number' && studentId) {
        const homeworkSubmit = await repos.homeworkSubmitRepository.findByHomeworkAndStudent(homeworkId, studentId)

        if (homeworkSubmit) {
          const pts = homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points
          const maxPts = homeworkSubmit.competitionSubmit?.maxPoints

          const pointsText =
            pts === null || pts === undefined
              ? ''
              : homeworkSubmit.competitionSubmitId && maxPts != null
                ? ` | 🎯 ${pts}/${maxPts}`
                : ` | 🎯 ${pts}`

          const feedbackText = homeworkSubmit.feedback ? `\n💬 NHẬN XÉT: ${homeworkSubmit.feedback}` : ''

          homeworkLine = `📚 BTVN: Đã nộp lúc ${formatVnDateTime(homeworkSubmit.submitAt)}${pointsText}${feedbackText}`
        } else {
          homeworkLine = '📚 BTVN: Chưa nộp'
        }
      }
    }

    const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status

    const attendanceTimeLabel =
      attendance.status === AttendanceStatus.ABSENT ? '⏰ THỜI GIAN ĐIỂM DANH' : '⏰ THỜI GIAN ĐẾN LỚP'

    const makeupLine =
      attendance.status === AttendanceStatus.ABSENT && attendance.classSession?.makeupNote
        ? `🔁 LỊCH HỌC BÙ: ${attendance.classSession.makeupNote}`
        : ''

    const messageText = AttendanceParentMessageTemplate.render({
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
      note: input.note,
    })

    const payload = {
      title: `Điểm danh: ${studentName}`,
      message: messageText,
      type: NotificationType.ATTENDANCE,
      level: NotificationLevel.INFO,
      data: {
        attendanceId: String(attendance.attendanceId),
        studentId: String(attendance.studentId),
        status: attendance.status,
      },
    }
    const digest = createHash('sha256').update(messageText).digest('hex').slice(0, 24)
    const queued = await this.queue.enqueueStudentAndParentsWithRepos(repos, {
      idempotencyKey: `attendance:${attendance.attendanceId}:${attendance.status}:${digest}`,
      sourceType: 'ATTENDANCE',
      sourceId: String(attendance.attendanceId),
      sourceEvent: 'PARENT_NOTIFY',
      title: payload.title,
      message: payload.message,
      type: payload.type,
      level: payload.level,
      data: payload.data,
      targets: [
        {
          studentId: attendance.studentId,
          parentPayload: payload,
          parentZaloId: attendance.student?.parentZaloId,
          zaloPayload: input.includeZalo === false ? undefined : payload,
          zaloAppId: appId,
        },
      ],
    })

    return {
      sent: Boolean(queued),
      messageText,
      ...(!queued && { errorMessage: 'Không thể xếp hàng notification' }),
    }
  }
}

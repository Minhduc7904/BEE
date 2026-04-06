import { Inject, Injectable } from '@nestjs/common'
import { ZaloService } from 'src/infrastructure/services'
import { AttendanceParentMessageTemplate } from 'src/infrastructure/templates/attendance-parent-message.template'
import { AttendanceStatus, AttendanceStatusLabels } from 'src/shared/enums'
import { formatVnDate, formatVnDateTime, formatVnTime } from 'src/shared/utils/vietnam-date.util'
import type { IUnitOfWork } from 'src/domain/repositories'
import { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'

interface SendBulkAttendanceToParentInput {
  attendanceIds: number[]
  appId?: string
  note?: string
  concurrency?: number
}

interface SendBulkAttendanceToParentResult {
  requestedCount: number
  sentCount: number
  failedCount: number
}

interface AttendanceNotificationJob {
  attendanceId: number
  studentId: number
  parentZaloId: string
  alreadyParentNotified: boolean
  messageText: string
}

@Injectable()
export class SendBulkAttendanceToParentUseCase {
  private static readonly DEFAULT_APP_ID = '443601004373365149'
  private static readonly DEFAULT_CONCURRENCY = 10

  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly zaloService: ZaloService,
    private readonly getValidZaloAccessTokenUseCase: GetValidZaloAccessTokenUseCase,
  ) { }

  async execute(input: SendBulkAttendanceToParentInput): Promise<SendBulkAttendanceToParentResult> {
    const uniqueAttendanceIds = [...new Set(input.attendanceIds)]
      .filter((attendanceId) => Number.isInteger(attendanceId) && attendanceId > 0)

    if (uniqueAttendanceIds.length === 0) {
      return {
        requestedCount: 0,
        sentCount: 0,
        failedCount: 0,
      }
    }

    const appId = input.appId || process.env.ZALO_APP_ID || SendBulkAttendanceToParentUseCase.DEFAULT_APP_ID
    const accessToken = await this.getValidZaloAccessTokenUseCase.execute({ appId })

    if (!accessToken) {
      console.warn(`[Attendance->Parent][Bulk] Không tìm thấy access token cho app_id=${appId}`)
      return {
        requestedCount: uniqueAttendanceIds.length,
        sentCount: 0,
        failedCount: uniqueAttendanceIds.length,
      }
    }

    const jobs = await this.buildJobs(uniqueAttendanceIds, input.note)
    if (jobs.length === 0) {
      return {
        requestedCount: uniqueAttendanceIds.length,
        sentCount: 0,
        failedCount: uniqueAttendanceIds.length,
      }
    }

    const concurrency = Math.max(1, input.concurrency || SendBulkAttendanceToParentUseCase.DEFAULT_CONCURRENCY)
    let sentCount = 0
    let failedCount = 0
    const successAttendanceIds: number[] = []

    for (let i = 0; i < jobs.length; i += concurrency) {
      const chunk = jobs.slice(i, i + concurrency)
      const settled = await Promise.allSettled(
        chunk.map((job) =>
          this.zaloService.sendMessage(accessToken, {
            recipient: { user_id: job.parentZaloId },
            message: { text: job.messageText },
          }),
        ),
      )

      settled.forEach((result, index) => {
        const job = chunk[index]
        if (result.status === 'fulfilled') {
          sentCount += 1
          successAttendanceIds.push(job.attendanceId)
          return
        }

        failedCount += 1
        const reason: any = result.reason
        const errorMessage =
          reason?.response?.data?.error_description ||
          reason?.response?.data?.message ||
          reason?.message ||
          'Unknown Zalo send error'

        console.warn('[Attendance->Parent][Bulk] Gửi Zalo thất bại:', {
          attendanceId: job.attendanceId,
          studentId: job.studentId,
          parentZaloId: job.parentZaloId,
          errorMessage,
        })
      })
    }

    await this.markParentNotifiedForSuccessfulJobs(jobs, successAttendanceIds)

    const skippedCount = uniqueAttendanceIds.length - jobs.length
    return {
      requestedCount: uniqueAttendanceIds.length,
      sentCount,
      failedCount: failedCount + skippedCount,
    }
  }

  private async buildJobs(attendanceIds: number[], note?: string): Promise<AttendanceNotificationJob[]> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      const attendances = await Promise.all(
        attendanceIds.map((attendanceId) => repos.attendanceRepository.findById(attendanceId)),
      )

      const jobs = await Promise.all(
        attendances
          .filter((attendance): attendance is NonNullable<typeof attendance> => Boolean(attendance))
          .map(async (attendance) => {
            const parentZaloId = attendance.student?.parentZaloId
            if (!parentZaloId) {
              return null
            }

            const studentName = attendance.student?.user
              ? `${attendance.student.user.lastName || ''} ${attendance.student.user.firstName || ''}`.trim()
              : `#${attendance.studentId}`

            const className = attendance.classSession?.courseClass?.className || 'N/A'
            const sessionDate = attendance.classSession?.sessionDate
              ? formatVnDate(attendance.classSession.sessionDate)
              : 'N/A'

            const sessionTime = attendance.classSession?.startTime && attendance.classSession?.endTime
              ? `${formatVnTime(attendance.classSession.startTime)} - ${formatVnTime(attendance.classSession.endTime)}`
              : ''

            const arrivalTime = attendance.markedAt
              ? formatVnDateTime(attendance.markedAt)
              : 'Chưa có dữ liệu'

            const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
            const attendanceTimeLabel = attendance.status === AttendanceStatus.ABSENT
              ? '⏰ THỜI GIAN ĐIỂM DANH'
              : '⏰ THỜI GIAN ĐẾN LỚP'

            const makeupLine = attendance.status === AttendanceStatus.ABSENT && attendance.classSession?.makeupNote
              ? `🔁 LỊCH HỌC BÙ: ${attendance.classSession.makeupNote}`
              : ''

            const homeworkLine = await this.buildHomeworkLine(attendance, repos)

            return {
              attendanceId: attendance.attendanceId,
              studentId: attendance.studentId,
              parentZaloId,
              alreadyParentNotified: attendance.parentNotified || false,
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
    })
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

    const homeworkSubmit = await repos.homeworkSubmitRepository.findByHomeworkAndStudent(
      homeworkId,
      studentId,
    )

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

    const feedbackText = homeworkSubmit.feedback
      ? `\n💬 NHẬN XÉT: ${homeworkSubmit.feedback}`
      : ''

    return `📚 BTVN: Đã nộp lúc ${formatVnDateTime(homeworkSubmit.submitAt)}${pointsText}${feedbackText}`
  }

  private async markParentNotifiedForSuccessfulJobs(jobs: AttendanceNotificationJob[], successAttendanceIds: number[]): Promise<void> {
    if (successAttendanceIds.length === 0) {
      return
    }

    const idsToUpdate = new Set(successAttendanceIds)
    const jobsToUpdate = jobs.filter((job) => idsToUpdate.has(job.attendanceId) && !job.alreadyParentNotified)

    if (jobsToUpdate.length === 0) {
      return
    }

    await this.unitOfWork.executeInTransaction(async (repos) => {
      await Promise.all(
        jobsToUpdate.map((job) =>
          repos.attendanceRepository.update(job.attendanceId, {
            parentNotified: true,
          }),
        ),
      )
    })
  }
}

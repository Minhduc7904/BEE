import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SendSessionAttendanceNotificationsUseCase } from '../../application/use-cases/attendance'

@Injectable()
export class AttendanceSessionNotificationScheduler {
  private readonly logger = new Logger(AttendanceSessionNotificationScheduler.name)

  constructor(private readonly notifier: SendSessionAttendanceNotificationsUseCase) {}

  @Cron('0 * * * * *', {
    name: 'attendance-session-notifier',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async notify(): Promise<void> {
    try {
      const result = await this.notifier.executeScheduled('SCHEDULER:ATTENDANCE_SESSION_NOTIFIER')
      if (!result) return
      if (result.sessions === 0 && result.failed === 0) return
      this.logger.log(
        `Attendance notifier job #${result.backgroundJobRunId}: sessions=${result.sessions}, reminders=${result.reminders}, summaries=${result.summaries}, recipients=${result.recipients}, failed=${result.failed}`,
      )
    } catch (error) {
      if (error instanceof ConflictException && error.message === 'ATTENDANCE_SESSION_NOTIFIER_ALREADY_RUNNING') {
        this.logger.debug('Bỏ qua thông báo điểm danh vì worker khác đang chạy')
        return
      }
      this.logger.error('Thông báo điểm danh theo buổi học thất bại', error instanceof Error ? error.stack : undefined)
    }
  }
}

import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { SendUpcomingAssistantShiftReminderEmailsUseCase } from 'src/application/use-cases/assistant-shift'

@Injectable()
export class AssistantShiftReminderScheduler {
  private readonly logger = new Logger(AssistantShiftReminderScheduler.name)

  constructor(private readonly reminderUseCase: SendUpcomingAssistantShiftReminderEmailsUseCase) {}

  @Cron('0 */5 * * * *', {
    name: 'assistant-shift-reminder',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async sendUpcomingReminders(): Promise<void> {
    try {
      const result = await this.reminderUseCase.executeScheduled('SCHEDULER:ASSISTANT_SHIFT_REMINDER')
      if (!result) {
        this.logger.debug('Bỏ qua nhắc lịch trợ giảng vì job đang tắt')
        return
      }
      if (result.failedEmailCount > 0) {
        this.logger.error(`Gửi ${result.failedEmailCount} email trợ giảng thất bại trong job #${result.backgroundJobRunId}`)
        for (const failure of result.emailFailures) {
          this.logger.error(`Assistant shift email failure: ${JSON.stringify(failure)}`)
        }
      }
      if (result.checkInEmailsSent + result.absenceEmailsSent > 0) {
        this.logger.log(`Job trợ giảng #${result.backgroundJobRunId}: ${result.checkInEmailsSent} email điểm danh, ${result.absenceEmailsSent} email vắng`)
      }
    } catch (error) {
      if (this.isAlreadyRunningError(error)) {
        this.logger.debug('Bỏ qua nhắc lịch trợ giảng vì worker khác đang chạy')
        return
      }
      this.logger.error('Job nhắc lịch trợ giảng thất bại')
    }
  }

  private isAlreadyRunningError(error: unknown): boolean {
    return error instanceof ConflictException && error.message === 'ASSISTANT_SHIFT_REMINDER_ALREADY_RUNNING'
  }
}

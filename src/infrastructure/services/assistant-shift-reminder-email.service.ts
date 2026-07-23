import { Inject, Injectable } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import type {
  AssistantShiftAbsenceNotificationEmailRequest,
  AssistantShiftReminderEmailRequest,
  IAssistantShiftReminderEmailService,
} from 'src/application/interfaces/assistant-shift-reminder-email.interface'
import emailConfig from 'src/config/email.config'
import type { IEmailService } from '../interfaces/email.interface'
import {
  createAssistantShiftAbsenceNotificationTemplate,
  createAssistantShiftReminderTemplate,
} from '../templates/assistant-shift-reminder.template'

@Injectable()
export class AssistantShiftReminderEmailService implements IAssistantShiftReminderEmailService {
  constructor(
    @Inject('IEmailService') private readonly emailService: IEmailService,
    @Inject(emailConfig.KEY) private readonly config: ConfigType<typeof emailConfig>,
  ) {}

  async sendReminder(input: AssistantShiftReminderEmailRequest): Promise<void> {
    const checkInUrl = new URL(
      `assistant-shifts/${input.assistantShiftId}/check-in`,
      `${this.config.apiBaseUrl}/`,
    )
    checkInUrl.searchParams.set('token', input.token)

    const template = createAssistantShiftReminderTemplate({
      recipientName: input.recipientName,
      shiftName: input.shiftName,
      startAt: input.startAt,
      endAt: input.endAt,
      checkInUrl: checkInUrl.toString(),
    })

    await this.emailService.sendRawEmail({
      to: input.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  async sendAbsenceNotification(input: AssistantShiftAbsenceNotificationEmailRequest): Promise<void> {
    const template = createAssistantShiftAbsenceNotificationTemplate({
      recipientName: input.recipientName,
      shiftName: input.shiftName,
      startAt: input.startAt,
      endAt: input.endAt,
    })
    await this.emailService.sendRawEmail({
      to: input.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }
}

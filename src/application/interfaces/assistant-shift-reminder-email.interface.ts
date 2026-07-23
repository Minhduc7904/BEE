/** Application port for the assistant-shift reminder email integration. */
export abstract class AssistantShiftReminderEmailServicePort {
  abstract sendReminder(input: AssistantShiftReminderEmailRequest): Promise<void>
  abstract sendAbsenceNotification(input: AssistantShiftAbsenceNotificationEmailRequest): Promise<void>
}

export interface AssistantShiftReminderEmailRequest {
  assistantShiftId: number
  token: string
  recipientEmail: string
  recipientName: string
  shiftName: string
  startAt: Date
  endAt: Date
}

export interface AssistantShiftAbsenceNotificationEmailRequest {
  recipientEmail: string
  recipientName: string
  shiftName: string
  startAt: Date
  endAt: Date
}

export interface IAssistantShiftReminderEmailService {
  sendReminder(input: AssistantShiftReminderEmailRequest): Promise<void>
  sendAbsenceNotification(input: AssistantShiftAbsenceNotificationEmailRequest): Promise<void>
}

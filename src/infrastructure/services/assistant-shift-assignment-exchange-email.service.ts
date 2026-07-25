import { Inject, Injectable } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import type {
  AssistantShiftRequestDeclinedEmail,
  AssistantShiftRequestAcceptedEmail,
  AssistantShiftSwapRequestEmail,
  AssistantShiftTransferRequestEmail,
  IAssistantShiftAssignmentExchangeEmailService,
} from 'src/application/interfaces/assistant-shift-assignment-exchange-email.interface'
import emailConfig from 'src/config/email.config'
import type { IEmailService } from '../interfaces/email.interface'
import {
  createAssistantShiftRequestDeclinedTemplate,
  createAssistantShiftRequestAcceptedTemplate,
  createAssistantShiftSwapRequestTemplate,
  createAssistantShiftTransferRequestTemplate,
} from '../templates/assistant-shift-assignment-exchange.template'

@Injectable()
export class AssistantShiftAssignmentExchangeEmailService implements IAssistantShiftAssignmentExchangeEmailService {
  constructor(
    @Inject('IEmailService') private readonly emailService: IEmailService,
    @Inject(emailConfig.KEY) private readonly config: ConfigType<typeof emailConfig>,
  ) {}

  async sendSwapRequest(input: AssistantShiftSwapRequestEmail): Promise<void> {
    const template = createAssistantShiftSwapRequestTemplate({
      recipientName: input.recipientName,
      requesterName: input.requesterName,
      shiftName: input.targetShiftName,
      startAt: input.targetStartAt,
      endAt: input.targetEndAt,
      sourceShiftName: input.sourceShiftName,
      sourceStartAt: input.sourceStartAt,
      sourceEndAt: input.sourceEndAt,
      acceptUrl: this.createActionUrl('swap', 'accept', input.actionToken),
      declineUrl: this.createActionUrl('swap', 'decline', input.actionToken),
    })

    await this.send(input.recipientEmail, template)
  }

  async sendTransferRequest(input: AssistantShiftTransferRequestEmail): Promise<void> {
    const template = createAssistantShiftTransferRequestTemplate({
      recipientName: input.recipientName,
      requesterName: input.requesterName,
      shiftName: input.shiftName,
      startAt: input.startAt,
      endAt: input.endAt,
      acceptUrl: this.createActionUrl('transfer', 'accept', input.actionToken),
      declineUrl: this.createActionUrl('transfer', 'decline', input.actionToken),
    })

    await this.send(input.recipientEmail, template)
  }

  async sendRequestAccepted(input: AssistantShiftRequestAcceptedEmail): Promise<void> {
    const template = createAssistantShiftRequestAcceptedTemplate({
      recipientName: input.recipientName,
      requesterName: input.counterpartName,
      action: input.action,
      recipientRole: input.recipientRole,
      shiftName: input.shiftName,
      startAt: input.startAt,
      endAt: input.endAt,
    })

    await this.send(input.recipientEmail, template)
  }

  async sendRequestDeclined(input: AssistantShiftRequestDeclinedEmail): Promise<void> {
    const template = createAssistantShiftRequestDeclinedTemplate({
      recipientName: input.requesterName,
      requesterName: input.recipientName,
      action: input.action,
      shiftName: input.shiftName,
      startAt: input.startAt,
      endAt: input.endAt,
    })

    await this.send(input.requesterEmail, template)
  }

  private createActionUrl(actionType: 'swap' | 'transfer', action: 'accept' | 'decline', actionToken: string): string {
    const url = new URL(`assistant-shift-assignment-actions/${actionType}/${action}`, `${this.config.apiBaseUrl}/`)
    url.searchParams.set('token', actionToken)

    return url.toString()
  }

  private async send(recipientEmail: string, template: { subject: string; html: string; text: string }): Promise<void> {
    await this.emailService.sendRawEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }
}

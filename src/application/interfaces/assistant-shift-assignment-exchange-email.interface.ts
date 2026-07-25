export abstract class AssistantShiftAssignmentExchangeEmailServicePort {
  abstract sendSwapRequest(input: AssistantShiftSwapRequestEmail): Promise<void>
  abstract sendTransferRequest(input: AssistantShiftTransferRequestEmail): Promise<void>
  abstract sendRequestDeclined(input: AssistantShiftRequestDeclinedEmail): Promise<void>
}

export interface AssistantShiftSwapRequestEmail {
  recipientEmail: string
  recipientName: string
  requesterName: string
  sourceShiftName: string
  sourceStartAt: Date
  sourceEndAt: Date
  targetShiftName: string
  targetStartAt: Date
  targetEndAt: Date
  actionToken: string
}

export interface AssistantShiftTransferRequestEmail {
  recipientEmail: string
  recipientName: string
  requesterName: string
  shiftName: string
  startAt: Date
  endAt: Date
  actionToken: string
}

export interface AssistantShiftRequestDeclinedEmail {
  requesterEmail: string
  requesterName: string
  recipientName: string
  action: 'đổi ca' | 'nhường ca'
  shiftName: string
  startAt: Date
  endAt: Date
}

export interface IAssistantShiftAssignmentExchangeEmailService {
  sendSwapRequest(input: AssistantShiftSwapRequestEmail): Promise<void>
  sendTransferRequest(input: AssistantShiftTransferRequestEmail): Promise<void>
  sendRequestDeclined(input: AssistantShiftRequestDeclinedEmail): Promise<void>
}

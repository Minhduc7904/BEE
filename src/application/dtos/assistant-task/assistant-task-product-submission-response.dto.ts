import { AssistantTaskProductSubmission } from '../../../domain/entities/assistant-task'

export class AssistantTaskProductSubmissionResponseDto {
  assistantTaskProductSubmissionId: number
  assistantTaskId: number
  assistantTaskProductId: number
  submittedAt: Date
  createdAt: Date
  updatedAt: Date

  constructor(entity: AssistantTaskProductSubmission) {
    this.assistantTaskProductSubmissionId = entity.assistantTaskProductSubmissionId
    this.assistantTaskId = entity.assistantTaskId
    this.assistantTaskProductId = entity.assistantTaskProductId
    this.submittedAt = entity.submittedAt
    this.createdAt = entity.createdAt
    this.updatedAt = entity.updatedAt
  }
}

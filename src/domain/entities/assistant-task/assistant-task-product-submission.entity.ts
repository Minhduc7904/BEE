export class AssistantTaskProductSubmission {
  assistantTaskProductSubmissionId: number
  assistantTaskId: number
  assistantTaskProductId: number
  submittedAt: Date
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    assistantTaskProductSubmissionId: number
    assistantTaskId: number
    assistantTaskProductId: number
    submittedAt: Date
    createdAt: Date
    updatedAt: Date
  }) {
    this.assistantTaskProductSubmissionId = data.assistantTaskProductSubmissionId
    this.assistantTaskId = data.assistantTaskId
    this.assistantTaskProductId = data.assistantTaskProductId
    this.submittedAt = data.submittedAt
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }
}

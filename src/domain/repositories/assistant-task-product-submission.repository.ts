import { AssistantTaskProductSubmission } from '../entities/assistant-task/assistant-task-product-submission.entity'
import type { AssistantTaskProductSubmissionListOptions } from '../interface/assistant-task'

export interface IAssistantTaskProductSubmissionRepository {
  create(assistantTaskId: number, assistantTaskProductId: number): Promise<AssistantTaskProductSubmission>
  findById(assistantTaskProductSubmissionId: number): Promise<AssistantTaskProductSubmission | null>
  findByTaskAndProduct(
    assistantTaskId: number,
    assistantTaskProductId: number,
  ): Promise<AssistantTaskProductSubmission | null>
  findAll(options?: AssistantTaskProductSubmissionListOptions): Promise<AssistantTaskProductSubmission[]>
  count(options?: AssistantTaskProductSubmissionListOptions): Promise<number>
  countByTaskId(assistantTaskId: number): Promise<number>
  countByProductId(assistantTaskProductId: number): Promise<number>
  delete(assistantTaskId: number, assistantTaskProductId: number): Promise<boolean>
}

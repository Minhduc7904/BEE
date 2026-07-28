import { AssistantTask } from '../entities/assistant-task'
import type {
  AssistantTaskListOptions,
  AssistantTaskRelationOptions,
  CreateAssistantTaskData,
  UpdateAssistantTaskData,
} from '../interface/assistant-task'

export interface IAssistantTaskRepository {
  create(data: CreateAssistantTaskData): Promise<AssistantTask>
  findById(assistantTaskId: number, options?: AssistantTaskRelationOptions): Promise<AssistantTask | null>
  findAll(options?: AssistantTaskListOptions): Promise<AssistantTask[]>
  update(assistantTaskId: number, data: UpdateAssistantTaskData): Promise<AssistantTask>
  delete(assistantTaskId: number): Promise<boolean>
}

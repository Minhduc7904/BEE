import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'

export interface AssistantTaskOffsetPaginationOptions {
  skip?: number
  take?: number
}

export interface CreateAssistantTaskData {
  courseId?: number | null
  assistantId?: number | null
  taskType?: AssistantTaskType | null
  status?: AssistantTaskStatus
  isBaseTask?: boolean
  deadlineAt?: Date | null
  completedAt?: Date | null
  note?: string | null
}

export interface UpdateAssistantTaskData {
  courseId?: number | null
  assistantId?: number | null
  taskType?: AssistantTaskType | null
  status?: AssistantTaskStatus
  isBaseTask?: boolean
  deadlineAt?: Date | null
  completedAt?: Date | null
  note?: string | null
}

export interface AssistantTaskRelationOptions {
  includeProducts?: boolean
}

export interface AssistantTaskListOptions extends AssistantTaskOffsetPaginationOptions, AssistantTaskRelationOptions {
  courseId?: number | null
  assistantId?: number | null
  taskType?: AssistantTaskType | null
  status?: AssistantTaskStatus
  isBaseTask?: boolean
  deadlineAtFrom?: Date
  deadlineAtTo?: Date
  completedAtFrom?: Date
  completedAtTo?: Date
}

export interface CreateAssistantTaskProductData {
  assistantTaskId?: number | null
  name?: string | null
  quantity?: number | null
}

export interface UpdateAssistantTaskProductData {
  assistantTaskId?: number | null
  name?: string | null
  quantity?: number | null
}

export interface AssistantTaskProductListOptions extends AssistantTaskOffsetPaginationOptions {
  assistantTaskId?: number | null
}

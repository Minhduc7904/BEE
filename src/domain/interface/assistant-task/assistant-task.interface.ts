import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'

export interface AssistantTaskOffsetPaginationOptions {
  skip?: number
  take?: number
}

export interface CreateAssistantTaskData {
  courseId?: number | null
  assistantId?: number | null
  taskName?: string | null
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
  taskName?: string | null
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
  taskName?: string | null
  taskType?: AssistantTaskType | null
  status?: AssistantTaskStatus
  isBaseTask?: boolean
  deadlineAtFrom?: Date
  deadlineAtTo?: Date
  completedAtFrom?: Date
  completedAtTo?: Date
  productId?: number
}

export interface CreateAssistantTaskProductData {
  assistantId: number
  examId?: number | null
  name?: string | null
  quantity?: number | null
}

export interface UpdateAssistantTaskProductData {
  name?: string | null
  quantity?: number | null
}

export interface AssistantTaskProductRelationOptions {
  includeTasks?: boolean
}

export interface AssistantTaskProductListOptions
  extends AssistantTaskOffsetPaginationOptions,
    AssistantTaskProductRelationOptions {
  assistantId?: number
  examId?: number | null
  createdAtFrom?: Date
  createdAtTo?: Date
  taskId?: number
}

export interface AssistantTaskProductSubmissionListOptions extends AssistantTaskOffsetPaginationOptions {
  assistantTaskId?: number
  assistantTaskProductId?: number
  submittedAtFrom?: Date
  submittedAtTo?: Date
}

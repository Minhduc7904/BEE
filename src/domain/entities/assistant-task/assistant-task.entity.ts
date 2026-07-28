import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'

import { AssistantTaskProduct } from './assistant-task-product.entity'

export class AssistantTask {
  assistantTaskId: number
  courseId: number | null
  assistantId: number | null
  taskName: string | null
  taskType: AssistantTaskType | null
  status: AssistantTaskStatus
  isBaseTask: boolean
  deadlineAt: Date | null
  completedAt: Date | null
  note: string | null
  createdAt: Date
  updatedAt: Date
  products?: AssistantTaskProduct[]

  constructor(data: {
    assistantTaskId: number
    courseId?: number | null
    assistantId?: number | null
    taskName?: string | null
    taskType?: AssistantTaskType | null
    status?: AssistantTaskStatus
    isBaseTask?: boolean
    deadlineAt?: Date | null
    completedAt?: Date | null
    note?: string | null
    createdAt?: Date
    updatedAt?: Date
    products?: AssistantTaskProduct[]
  }) {
    this.assistantTaskId = data.assistantTaskId
    this.courseId = data.courseId ?? null
    this.assistantId = data.assistantId ?? null
    this.taskName = data.taskName ?? null
    this.taskType = data.taskType ?? null
    this.status = data.status ?? AssistantTaskStatus.PENDING
    this.isBaseTask = data.isBaseTask ?? false
    this.deadlineAt = data.deadlineAt ?? null
    this.completedAt = data.completedAt ?? null
    this.note = data.note ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
    this.products = data.products
  }

  isLate(referenceAt: Date = new Date()): boolean {
    return (
      !this.isBaseTask &&
      this.deadlineAt !== null &&
      this.status !== AssistantTaskStatus.COMPLETED &&
      this.deadlineAt < referenceAt
    )
  }

  equals(other: AssistantTask): boolean {
    return this.assistantTaskId === other.assistantTaskId
  }
}

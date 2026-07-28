import { AssistantTask } from '../../../domain/entities/assistant-task'
import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'

export class AssistantTaskResponseDto {
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
  products?: Array<{
    assistantTaskProductId: number
    assistantId: number
    examId: number | null
    name: string | null
    quantity: number | null
    createdAt: Date
    updatedAt: Date
  }>

  constructor(entity: AssistantTask) {
    this.assistantTaskId = entity.assistantTaskId
    this.courseId = entity.courseId
    this.assistantId = entity.assistantId
    this.taskName = entity.taskName
    this.taskType = entity.taskType
    this.status = entity.status
    this.isBaseTask = entity.isBaseTask
    this.deadlineAt = entity.deadlineAt
    this.completedAt = entity.completedAt
    this.note = entity.note
    this.createdAt = entity.createdAt
    this.updatedAt = entity.updatedAt
    this.products = entity.products?.map((product) => ({
      assistantTaskProductId: product.assistantTaskProductId,
      assistantId: product.assistantId,
      examId: product.examId,
      name: product.name,
      quantity: product.quantity,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))
  }
}

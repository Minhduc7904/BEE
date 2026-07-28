import { AssistantTaskProduct } from '../../../domain/entities/assistant-task'
import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'

export class AssistantTaskProductResponseDto {
  assistantTaskProductId: number
  assistantId: number
  examId: number | null
  name: string | null
  quantity: number | null
  createdAt: Date
  updatedAt: Date
  tasks?: Array<{
    assistantTaskId: number
    courseId: number | null
    assistantId: number | null
    taskName: string | null
    taskType: AssistantTaskType | null
    status: AssistantTaskStatus
    deadlineAt: Date | null
    completedAt: Date | null
  }>

  constructor(entity: AssistantTaskProduct) {
    this.assistantTaskProductId = entity.assistantTaskProductId
    this.assistantId = entity.assistantId
    this.examId = entity.examId
    this.name = entity.name
    this.quantity = entity.quantity
    this.createdAt = entity.createdAt
    this.updatedAt = entity.updatedAt
    this.tasks = entity.tasks?.map((task) => ({
      assistantTaskId: task.assistantTaskId,
      courseId: task.courseId,
      assistantId: task.assistantId,
      taskName: task.taskName,
      taskType: task.taskType,
      status: task.status,
      deadlineAt: task.deadlineAt,
      completedAt: task.completedAt,
    }))
  }
}

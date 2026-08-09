import type { AssistantTask } from './assistant-task.entity'

export class AssistantTaskProduct {
  assistantTaskProductId: number
  assistantId: number
  examId: number | null
  examName?: string | null
  solutionYoutubeUrl?: string | null
  name: string | null
  quantity: number | null
  createdAt: Date
  updatedAt: Date
  tasks?: AssistantTask[]

  constructor(data: {
    assistantTaskProductId: number
    assistantId: number
    examId?: number | null
    examName?: string | null
    solutionYoutubeUrl?: string | null
    name?: string | null
    quantity?: number | null
    createdAt?: Date
    updatedAt?: Date
    tasks?: AssistantTask[]
  }) {
    this.assistantTaskProductId = data.assistantTaskProductId
    this.assistantId = data.assistantId
    this.examId = data.examId ?? null
    this.examName = data.examName
    this.solutionYoutubeUrl = data.solutionYoutubeUrl
    this.name = data.name ?? null
    this.quantity = data.quantity ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
    this.tasks = data.tasks
  }

  equals(other: AssistantTaskProduct): boolean {
    return this.assistantTaskProductId === other.assistantTaskProductId
  }
}

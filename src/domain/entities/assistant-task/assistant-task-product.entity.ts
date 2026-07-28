export class AssistantTaskProduct {
  assistantTaskProductId: number
  assistantTaskId: number | null
  name: string | null
  quantity: number | null
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    assistantTaskProductId: number
    assistantTaskId?: number | null
    name?: string | null
    quantity?: number | null
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.assistantTaskProductId = data.assistantTaskProductId
    this.assistantTaskId = data.assistantTaskId ?? null
    this.name = data.name ?? null
    this.quantity = data.quantity ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  equals(other: AssistantTaskProduct): boolean {
    return this.assistantTaskProductId === other.assistantTaskProductId
  }
}

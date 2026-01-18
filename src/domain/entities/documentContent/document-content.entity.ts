// src/domain/entities/documentContent/document-content.entity.ts

import { LearningItem } from '../learningItem/learning-item.entity'

export class DocumentContent {
  // Required properties
  documentContentId: number
  learningItemId: number
  content: string
  createdAt: Date
  updatedAt: Date

  // Optional properties
  orderInDocument?: number | null

  // Navigation properties
  learningItem?: LearningItem

  constructor(data: {
    documentContentId: number
    learningItemId: number
    content: string
    createdAt?: Date
    updatedAt?: Date
    orderInDocument?: number | null
    learningItem?: LearningItem
  }) {
    this.documentContentId = data.documentContentId
    this.learningItemId = data.learningItemId
    this.content = data.content
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.orderInDocument = data.orderInDocument
    this.learningItem = data.learningItem
  }

  // Business logic methods
  updateContent(newContent: string): void {
    this.content = newContent
    this.updatedAt = new Date()
  }

  updateOrder(newOrder: number): void {
    this.orderInDocument = newOrder
    this.updatedAt = new Date()
  }

  // Validation methods
  isValid(): boolean {
    return (
      this.documentContentId > 0 &&
      this.learningItemId > 0 &&
      this.content.trim().length > 0
    )
  }
}

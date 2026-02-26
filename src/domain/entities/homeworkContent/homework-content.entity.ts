// src/domain/entities/homeworkContent/homework-content.entity.ts

import { LearningItem } from '../learningItem/learning-item.entity'
import { HomeworkSubmit } from '../homeworkSubmit/homework-submit.entity'
import { Competition } from '../exam/competition.entity'

export class HomeworkContent {
  // Required properties
  homeworkContentId: number
  learningItemId: number
  content: string
  allowLateSubmit: boolean
  updatePointsOnLateSubmit: boolean
  updatePointsOnReSubmit: boolean
  updateMaxPoints: boolean
  createdAt: Date
  updatedAt: Date

  // Optional properties
  dueDate?: Date | null
  competitionId?: number | null

  // Navigation properties
  learningItem?: LearningItem
  competition?: Competition
  homeworkSubmits?: HomeworkSubmit[]

  constructor(data: {
    homeworkContentId: number
    learningItemId: number
    content: string
    allowLateSubmit?: boolean
    updatePointsOnLateSubmit?: boolean
    updatePointsOnReSubmit?: boolean
    updateMaxPoints?: boolean
    createdAt?: Date
    updatedAt?: Date
    dueDate?: Date | null
    competitionId?: number | null
    learningItem?: LearningItem
    competition?: Competition
    homeworkSubmits?: HomeworkSubmit[]
  }) {
    this.homeworkContentId = data.homeworkContentId
    this.learningItemId = data.learningItemId
    this.content = data.content
    this.allowLateSubmit = data.allowLateSubmit ?? false
    this.updatePointsOnLateSubmit = data.updatePointsOnLateSubmit ?? false
    this.updatePointsOnReSubmit = data.updatePointsOnReSubmit ?? false
    this.updateMaxPoints = data.updateMaxPoints ?? false
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.dueDate = data.dueDate
    this.competitionId = data.competitionId
    this.learningItem = data.learningItem
    this.competition = data.competition
    this.homeworkSubmits = data.homeworkSubmits || []
  }

  // Business logic methods
  updateContent(newContent: string): void {
    this.content = newContent
    this.updatedAt = new Date()
  }

  updateDueDate(newDueDate: Date | null): void {
    this.dueDate = newDueDate
    this.updatedAt = new Date()
  }

  toggleLateSubmit(): void {
    this.allowLateSubmit = !this.allowLateSubmit
    this.updatedAt = new Date()
  }

  // Validation methods
  isValid(): boolean {
    return (
      this.homeworkContentId > 0 &&
      this.learningItemId > 0 &&
      this.content.trim().length > 0
    )
  }

  isPastDue(): boolean {
    if (!this.dueDate) return false
    return new Date() > this.dueDate
  }

  canSubmit(): boolean {
    if (!this.dueDate) return true
    return this.allowLateSubmit || !this.isPastDue()
  }

  getSubmitCount(): number {
    return this.homeworkSubmits?.length || 0
  }

  getGradedCount(): number {
    return this.homeworkSubmits?.filter(submit => submit.points !== null).length || 0
  }
}

// src/domain/entities/homeworkSubmit/homework-submit.entity.ts

import { HomeworkContent } from '../homeworkContent/homework-content.entity'
import { Student } from '../user/student.entity'
import { Admin } from '../user/admin.entity'
import { CompetitionSubmit } from '../exam/competition-submit.entity'

export class HomeworkSubmit {
  // Required properties
  homeworkSubmitId: number
  homeworkContentId: number
  studentId: number
  submitAt: Date
  content: string
  createdAt: Date
  updatedAt: Date

  // Optional properties
  competitionSubmitId?: number | null
  points?: number | null
  gradedAt?: Date | null
  graderId?: number | null
  feedback?: string | null

  // Navigation properties
  homeworkContent?: HomeworkContent
  student?: Student
  grader?: Admin | null
  competitionSubmit?: CompetitionSubmit | null

  constructor(data: {
    homeworkSubmitId: number
    homeworkContentId: number
    studentId: number
    submitAt?: Date
    content: string
    createdAt?: Date
    updatedAt?: Date
    competitionSubmitId?: number | null
    points?: number | null
    gradedAt?: Date | null
    graderId?: number | null
    feedback?: string | null
    homeworkContent?: HomeworkContent
    student?: Student
    grader?: Admin | null
    competitionSubmit?: CompetitionSubmit | null
  }) {
    this.homeworkSubmitId = data.homeworkSubmitId
    this.homeworkContentId = data.homeworkContentId
    this.studentId = data.studentId
    this.submitAt = data.submitAt || new Date()
    this.content = data.content
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.competitionSubmitId = data.competitionSubmitId
    this.points = data.points
    this.gradedAt = data.gradedAt
    this.graderId = data.graderId
    this.feedback = data.feedback
    this.homeworkContent = data.homeworkContent
    this.student = data.student
    this.grader = data.grader
    this.competitionSubmit = data.competitionSubmit
  }

  // Business logic methods
  updateContent(newContent: string): void {
    this.content = newContent
    this.updatedAt = new Date()
  }

  grade(points: number, graderId: number, feedback?: string): void {
    this.points = points
    this.graderId = graderId
    this.feedback = feedback
    this.gradedAt = new Date()
    this.updatedAt = new Date()
  }

  updateGrade(points: number, feedback?: string): void {
    this.points = points
    if (feedback !== undefined) {
      this.feedback = feedback
    }
    this.updatedAt = new Date()
  }

  clearGrade(): void {
    this.points = null
    this.gradedAt = null
    this.graderId = null
    this.feedback = null
    this.updatedAt = new Date()
  }

  // Validation methods
  isValid(): boolean {
    return (
      this.homeworkSubmitId > 0 &&
      this.homeworkContentId > 0 &&
      this.studentId > 0 &&
      this.content.trim().length > 0
    )
  }

  isGraded(): boolean {
    return this.points !== null && this.points !== undefined
  }

  hasGrader(): boolean {
    return this.graderId !== null && this.graderId !== undefined
  }

  hasFeedback(): boolean {
    return !!this.feedback && this.feedback.trim().length > 0
  }

  isLateSubmission(dueDate?: Date): boolean {
    if (!dueDate) return false
    return this.submitAt > dueDate
  }
}

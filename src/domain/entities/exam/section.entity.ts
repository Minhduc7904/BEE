// src/domain/entities/exam/section.entity.ts
import { Exam } from './exam.entity'
import { QuestionExam } from './question-exam.entity'

export class Section {
  // Required properties
  sectionId: number
  examId: number
  title: string
  order: number
  createdAt: Date
  updatedAt: Date

  // Optional properties
  description?: string | null

  // Relations (optional - sẽ được populate khi cần)
  exam?: Exam
  questions?: QuestionExam[]

  constructor(data: {
    sectionId: number
    examId: number
    title: string
    order: number
    createdAt: Date
    updatedAt: Date
    description?: string | null
    exam?: Exam
    questions?: QuestionExam[]
  }) {
    this.sectionId = data.sectionId
    this.examId = data.examId
    this.title = data.title
    this.order = data.order
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.description = data.description
    this.exam = data.exam
    this.questions = data.questions
  }

  // Validation methods
  hasDescription(): boolean {
    return this.description !== null && this.description !== undefined && this.description.trim() !== ''
  }

  hasQuestions(): boolean {
    return this.questions !== undefined && this.questions.length > 0
  }

  // Utility methods
  getQuestionCount(): number {
    return this.questions?.length || 0
  }
}

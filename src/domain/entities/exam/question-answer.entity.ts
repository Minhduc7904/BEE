import { ExamAttempt } from './exam-attempt.entity'
import { Question } from './question.entity'

export class QuestionAnswer {
  questionAnswerId: number
  attemptId: number
  questionId: number

  answer?: string | null
  selectedStatementIds?: number[] | null
  isCorrect?: boolean | null
  points?: number | null
  maxPoints?: number | null
  timeSpentSeconds?: number | null

  examAttempt?: ExamAttempt | null
  question?: Question | null

  constructor(data: {
    questionAnswerId: number
    attemptId: number
    questionId: number
    answer?: string | null
    selectedStatementIds?: number[] | null
    isCorrect?: boolean | null
    points?: number | null
    maxPoints?: number | null
    timeSpentSeconds?: number | null
    examAttempt?: ExamAttempt | null | undefined
    question?: Question | null | undefined
  }) {
    this.questionAnswerId = data.questionAnswerId
    this.attemptId = data.attemptId
    this.questionId = data.questionId
    this.answer = data.answer
    this.selectedStatementIds = data.selectedStatementIds
    this.isCorrect = data.isCorrect
    this.points = data.points
    this.maxPoints = data.maxPoints
    this.timeSpentSeconds = data.timeSpentSeconds
    this.examAttempt = data.examAttempt
    this.question = data.question
  }

  hasTextAnswer(): boolean {
    return Boolean(this.answer && this.answer.trim().length > 0)
  }

  hasSelectedStatements(): boolean {
    return Boolean(this.selectedStatementIds && this.selectedStatementIds.length > 0)
  }

  hasAnswer(): boolean {
    return this.hasTextAnswer() || this.hasSelectedStatements()
  }

  hasScore(): boolean {
    return this.points !== null && this.points !== undefined
  }

  isAnsweredCorrectly(): boolean {
    return this.isCorrect === true
  }

  getSelectedStatementIds(): number[] {
    return this.selectedStatementIds ?? []
  }
}

import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'
import { Exam } from './exam.entity'
import { Student } from '../user/student.entity'
import { QuestionAnswer } from './question-answer.entity'

export class ExamAttempt {
  attemptId: number
  examId: number
  studentId: number
  status: ExamAttemptStatus
  startedAt: Date

  score?: number | null
  endAt?: Date | null
  points?: number | null
  maxPoints?: number | null
  questionIds?: number[] | null

  exam?: Exam | null
  student?: Student | null
  questionAnswers?: QuestionAnswer[]

  constructor(data: {
    attemptId: number
    examId: number
    studentId: number
    status: ExamAttemptStatus
    startedAt: Date
    score?: number | null
    endAt?: Date | null
    points?: number | null
    maxPoints?: number | null
    questionIds?: number[] | null
    exam?: Exam | null | undefined
    student?: Student | null | undefined
    questionAnswers?: QuestionAnswer[]
  }) {
    this.attemptId = data.attemptId
    this.examId = data.examId
    this.studentId = data.studentId
    this.status = data.status
    this.startedAt = data.startedAt
    this.score = data.score
    this.endAt = data.endAt
    this.points = data.points
    this.maxPoints = data.maxPoints
    this.questionIds = data.questionIds
    this.exam = data.exam
    this.student = data.student
    this.questionAnswers = data.questionAnswers
  }

  isInProgress(): boolean {
    return this.status === ExamAttemptStatus.IN_PROGRESS
  }

  isSubmitted(): boolean {
    return this.status === ExamAttemptStatus.SUBMITTED
  }

  hasEnded(): boolean {
    return this.endAt !== null && this.endAt !== undefined
  }

  hasScore(): boolean {
    return this.score !== null && this.score !== undefined
  }

  getQuestionIds(): number[] {
    return this.questionIds ?? []
  }

  getQuestionCount(): number {
    return this.getQuestionIds().length
  }

  getAnswerCount(): number {
    return this.questionAnswers?.length ?? 0
  }
}

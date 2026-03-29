import { Decimal } from '@prisma/client/runtime/library'
import { QuestionAnswer } from '../../../domain/entities/exam/question-answer.entity'
import { ExamAttempt } from '../../../domain/entities/exam/exam-attempt.entity'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'
import { QuestionMapper } from './question.mapper'
import { ExamMapper } from './exam.mapper'

export class QuestionAnswerMapper {
  static toDomainQuestionAnswer(prismaAnswer: any): QuestionAnswer | null {
    if (!prismaAnswer) return null

    return new QuestionAnswer({
      questionAnswerId: prismaAnswer.questionAnswerId,
      attemptId: prismaAnswer.attemptId ?? undefined,
      questionId: prismaAnswer.questionId,
      answer: prismaAnswer.answer ?? undefined,
      selectedStatementIds: this.parseNumberArray(prismaAnswer.selectedStatementIds),
      isCorrect: prismaAnswer.isCorrect ?? undefined,
      points: prismaAnswer.points ? this.decimalToNumber(prismaAnswer.points) : undefined,
      maxPoints: prismaAnswer.maxPoints ? this.decimalToNumber(prismaAnswer.maxPoints) : undefined,
      timeSpentSeconds: prismaAnswer.timeSpentSeconds ?? undefined,
      examAttempt: prismaAnswer.examAttempt
        ? new ExamAttempt({
          attemptId: prismaAnswer.examAttempt.attemptId,
          examId: prismaAnswer.examAttempt.examId,
          studentId: prismaAnswer.examAttempt.studentId,
          status: prismaAnswer.examAttempt.status as ExamAttemptStatus,
          startedAt: prismaAnswer.examAttempt.startedAt,
          endAt: prismaAnswer.examAttempt.endAt ?? undefined,
          score: prismaAnswer.examAttempt.score ?? undefined,
          points: prismaAnswer.examAttempt.points
            ? this.decimalToNumber(prismaAnswer.examAttempt.points)
            : undefined,
          maxPoints: prismaAnswer.examAttempt.maxPoints
            ? this.decimalToNumber(prismaAnswer.examAttempt.maxPoints)
            : undefined,
          questionIds: this.parseNumberArray(prismaAnswer.examAttempt.questionIds),
          exam: prismaAnswer.examAttempt.exam
            ? ExamMapper.toDomainExam(prismaAnswer.examAttempt.exam)
            : undefined,
        })
        : undefined,
      question: prismaAnswer.question ? QuestionMapper.toDomainQuestion(prismaAnswer.question) : undefined,
    })
  }

  static toDomainQuestionAnswers(prismaAnswers: any[]): QuestionAnswer[] {
    return prismaAnswers.map((item) => this.toDomainQuestionAnswer(item)).filter(Boolean) as QuestionAnswer[]
  }

  private static decimalToNumber(decimal: Decimal | number | null | undefined): number | undefined {
    if (decimal === null || decimal === undefined) return undefined
    if (typeof decimal === 'number') return decimal
    return decimal.toNumber()
  }

  private static parseNumberArray(value: unknown): number[] | undefined {
    if (value === null || value === undefined) return undefined

    if (Array.isArray(value)) {
      return value.map((item) => Number(item)).filter((item) => Number.isFinite(item))
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (!Array.isArray(parsed)) return undefined
        return parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item))
      } catch {
        return undefined
      }
    }

    return undefined
  }
}

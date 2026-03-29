import { Decimal } from '@prisma/client/runtime/library'
import { ExamAttempt } from '../../../domain/entities/exam/exam-attempt.entity'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'
import { ExamMapper } from './exam.mapper'
import { StudentMapper } from '../user/student.mapper'
import { QuestionAnswerMapper } from './question-answer.mapper'

export class ExamAttemptMapper {
  static toDomainExamAttempt(prismaAttempt: any): ExamAttempt | null {
    if (!prismaAttempt) return null

    return new ExamAttempt({
      attemptId: prismaAttempt.attemptId,
      examId: prismaAttempt.examId,
      studentId: prismaAttempt.studentId,
      score: prismaAttempt.score ?? undefined,
      duration: prismaAttempt.duration ?? undefined,
      startedAt: prismaAttempt.startedAt,
      endAt: prismaAttempt.endAt ?? undefined,
      status: prismaAttempt.status as ExamAttemptStatus,
      points: prismaAttempt.points ? this.decimalToNumber(prismaAttempt.points) : undefined,
      maxPoints: prismaAttempt.maxPoints ? this.decimalToNumber(prismaAttempt.maxPoints) : undefined,
      questionIds: this.parseNumberArray(prismaAttempt.questionIds),
      exam: prismaAttempt.exam ? ExamMapper.toDomainExam(prismaAttempt.exam) : undefined,
      student: prismaAttempt.student ? StudentMapper.toDomainStudent(prismaAttempt.student) : undefined,
      questionAnswers: prismaAttempt.questionAnswers
        ? QuestionAnswerMapper.toDomainQuestionAnswers(prismaAttempt.questionAnswers)
        : undefined,
    })
  }

  static toDomainExamAttempts(prismaAttempts: any[]): ExamAttempt[] {
    return prismaAttempts.map((item) => this.toDomainExamAttempt(item)).filter(Boolean) as ExamAttempt[]
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

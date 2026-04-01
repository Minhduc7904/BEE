import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionAnswerRepository, IStudentRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
  StudentQuestionAnswerChapterStatisticsItemDto,
  StudentQuestionAnswerDailyStatisticsItemDto,
  StudentQuestionAnswerDifficultyStatisticsItemDto,
  StudentQuestionAnswerStatisticsDataDto,
  StudentQuestionAnswerStatisticsResponseDto,
  StudentQuestionAnswerStatisticsSummaryDto,
} from '../../dtos/question-answer/student-question-answer-statistics.dto'
import { StudentQuestionAnswerStatisticsQueryDto } from '../../dtos/question-answer/student-question-answer-statistics-query.dto'
import {
  ForbiddenException,
  NotFoundException,
  ValidationException,
} from '../../../shared/exceptions/custom-exceptions'
import { formatVnDateISO } from '../../../shared/utils/vietnam-date.util'

@Injectable()
export class GetPublicStudentQuestionAnswerStatisticsUseCase {
  constructor(
    @Inject('IQuestionAnswerRepository')
    private readonly questionAnswerRepository: IQuestionAnswerRepository,
    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(
    studentId: number,
    query: StudentQuestionAnswerStatisticsQueryDto,
  ): Promise<StudentQuestionAnswerStatisticsResponseDto> {
    const student = await this.studentRepository.findById(studentId)

    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    if (!student.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const fromDate = this.normalizeDateInput(query.fromDate, 'fromDate')
    const toDate = this.normalizeDateInput(query.toDate, 'toDate')

    if (fromDate && toDate && fromDate > toDate) {
      throw new ValidationException('fromDate phải nhỏ hơn hoặc bằng toDate')
    }

    const stats = await this.questionAnswerRepository.getPublicStudentStatistics(studentId, {
      fromDate,
      toDate,
    })

    const byChapter = stats.byChapter.map(
      (item) =>
        new StudentQuestionAnswerChapterStatisticsItemDto({
          chapterId: item.chapterId,
          chapterName: item.chapterName,
          totalQuestionsInChapter: item.totalQuestionsInChapter,
          answeredCount: item.answeredCount,
          correctCount: item.correctCount,
          incorrectCount: item.incorrectCount,
        }),
    )

    const byDifficulty = stats.byDifficulty.map(
      (item) =>
        new StudentQuestionAnswerDifficultyStatisticsItemDto({
          difficulty: item.difficulty,
          answeredCount: item.answeredCount,
          correctCount: item.correctCount,
          incorrectCount: item.incorrectCount,
        }),
    )

    const byDay = stats.byDay.map(
      (item) =>
        new StudentQuestionAnswerDailyStatisticsItemDto({
          dateIso: item.date,
          answeredCount: item.answeredCount,
        }),
    )

    const totalAnswered = byDifficulty.reduce((sum, item) => sum + item.answeredCount, 0)
    const totalCorrect = byDifficulty.reduce((sum, item) => sum + item.correctCount, 0)
    const totalIncorrect = byDifficulty.reduce((sum, item) => sum + item.incorrectCount, 0)

    const summary = new StudentQuestionAnswerStatisticsSummaryDto({
      totalAnswered,
      totalCorrect,
      totalIncorrect,
    })

    const data = new StudentQuestionAnswerStatisticsDataDto({
      fromDate,
      toDate,
      byChapter,
      byDifficulty,
      byDay,
      summary,
    })

    return BaseResponseDto.success('Lấy thống kê câu trả lời theo học sinh thành công', data)
  }

  private normalizeDateInput(input: string | undefined, fieldName: 'fromDate' | 'toDate'): string | undefined {
    if (!input) return undefined

    const value = input.trim()

    const dmyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (dmyMatch) {
      const day = Number(dmyMatch[1])
      const month = Number(dmyMatch[2])
      const year = Number(dmyMatch[3])
      const utcDate = new Date(Date.UTC(year, month - 1, day))

      const isValid =
        utcDate.getUTCFullYear() === year &&
        utcDate.getUTCMonth() + 1 === month &&
        utcDate.getUTCDate() === day

      if (!isValid) {
        throw new ValidationException(`${fieldName} không đúng định dạng ngày hợp lệ`)
      }

      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationException(`${fieldName} phải là ISO date hoặc dd/MM/yyyy`)
    }

    return formatVnDateISO(parsed)
  }
}

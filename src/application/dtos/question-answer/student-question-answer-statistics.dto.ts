import { BaseResponseDto } from '../common/base-response.dto'
import { Difficulty, DifficultyLabels } from '../../../shared/enums'
import { formatVnDate } from '../../../shared/utils/vietnam-date.util'

export class StudentQuestionAnswerChapterStatisticsItemDto {
  chapterId: number | null
  chapterName: string
  totalQuestionsInChapter: number
  answeredCount: number
  correctCount: number
  incorrectCount: number
  correctRate: number

  constructor(data: {
    chapterId: number | null
    chapterName: string
    totalQuestionsInChapter: number
    answeredCount: number
    correctCount: number
    incorrectCount: number
  }) {
    this.chapterId = data.chapterId
    this.chapterName = data.chapterName
    this.totalQuestionsInChapter = data.totalQuestionsInChapter
    this.answeredCount = data.answeredCount
    this.correctCount = data.correctCount
    this.incorrectCount = data.incorrectCount
    this.correctRate =
      this.answeredCount > 0
        ? Math.round((this.correctCount / this.answeredCount) * 10000) / 100
        : 0
  }
}

export class StudentQuestionAnswerDifficultyStatisticsItemDto {
  difficulty: Difficulty | null
  label: string
  answeredCount: number
  correctCount: number
  incorrectCount: number
  correctRate: number

  constructor(data: {
    difficulty: Difficulty | null
    answeredCount: number
    correctCount: number
    incorrectCount: number
  }) {
    this.difficulty = data.difficulty
    this.label = data.difficulty
      ? DifficultyLabels[data.difficulty]
      : 'Chưa phân loại độ khó'
    this.answeredCount = data.answeredCount
    this.correctCount = data.correctCount
    this.incorrectCount = data.incorrectCount
    this.correctRate =
      this.answeredCount > 0
        ? Math.round((this.correctCount / this.answeredCount) * 10000) / 100
        : 0
  }
}

export class StudentQuestionAnswerDailyStatisticsItemDto {
  date: string
  dateIso: string
  answeredCount: number

  constructor(data: { dateIso: string; answeredCount: number }) {
    this.dateIso = data.dateIso
    this.date = formatVnDate(`${data.dateIso}T00:00:00.000Z`)
    this.answeredCount = data.answeredCount
  }
}

export class StudentQuestionAnswerStatisticsSummaryDto {
  totalAnswered: number
  totalCorrect: number
  totalIncorrect: number
  overallCorrectRate: number

  constructor(data: {
    totalAnswered: number
    totalCorrect: number
    totalIncorrect: number
  }) {
    this.totalAnswered = data.totalAnswered
    this.totalCorrect = data.totalCorrect
    this.totalIncorrect = data.totalIncorrect
    this.overallCorrectRate =
      this.totalAnswered > 0
        ? Math.round((this.totalCorrect / this.totalAnswered) * 10000) / 100
        : 0
  }
}

export class StudentQuestionAnswerStatisticsDataDto {
  timezone: string
  fromDate?: string
  toDate?: string
  summary: StudentQuestionAnswerStatisticsSummaryDto
  byChapter: StudentQuestionAnswerChapterStatisticsItemDto[]
  byDifficulty: StudentQuestionAnswerDifficultyStatisticsItemDto[]
  byDay: StudentQuestionAnswerDailyStatisticsItemDto[]

  constructor(data: {
    fromDate?: string
    toDate?: string
    byChapter: StudentQuestionAnswerChapterStatisticsItemDto[]
    byDifficulty: StudentQuestionAnswerDifficultyStatisticsItemDto[]
    byDay: StudentQuestionAnswerDailyStatisticsItemDto[]
    summary: StudentQuestionAnswerStatisticsSummaryDto
  }) {
    this.timezone = 'Asia/Ho_Chi_Minh'
    this.fromDate = data.fromDate
    this.toDate = data.toDate
    this.byChapter = data.byChapter
    this.byDifficulty = data.byDifficulty
    this.byDay = data.byDay
    this.summary = data.summary
  }
}

export class StudentQuestionAnswerStatisticsResponseDto extends BaseResponseDto<StudentQuestionAnswerStatisticsDataDto> {}

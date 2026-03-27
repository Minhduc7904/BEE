import { Difficulty, DifficultyLabels } from '../../../shared/enums'

export class StudentDifficultyProgressItemDto {
  difficulty: Difficulty
  label: string
  done: number
  total: number
  percentage: number

  constructor(data: { difficulty: Difficulty; done: number; total: number }) {
    this.difficulty = data.difficulty
    this.label = DifficultyLabels[data.difficulty]
    this.done = data.done
    this.total = data.total
    this.percentage = data.total > 0 ? Math.round((data.done / data.total) * 10000) / 100 : 0
  }
}

export class StudentDifficultyProgressResponseDto {
  totalDone: number
  totalQuestions: number
  overallPercentage: number
  items: StudentDifficultyProgressItemDto[]

  constructor(items: StudentDifficultyProgressItemDto[]) {
    this.items = items
    this.totalDone = items.reduce((sum, item) => sum + item.done, 0)
    this.totalQuestions = items.reduce((sum, item) => sum + item.total, 0)
    this.overallPercentage =
      this.totalQuestions > 0
        ? Math.round((this.totalDone / this.totalQuestions) * 10000) / 100
        : 0
  }
}

export class StudentDailyActivityItemDto {
  date: string
  competitionSubmitCount: number
  examAttemptCount: number
  totalCount: number

  constructor(data: {
    date: string
    competitionSubmitCount: number
    examAttemptCount: number
  }) {
    this.date = data.date
    this.competitionSubmitCount = data.competitionSubmitCount
    this.examAttemptCount = data.examAttemptCount
    this.totalCount = data.competitionSubmitCount + data.examAttemptCount
  }
}

export class StudentYearlyActivityResponseDto {
  year: number
  totalCompetitionSubmits: number
  totalExamAttempts: number
  totalActivities: number
  totalActiveDays: number
  maxStreak: number
  days: StudentDailyActivityItemDto[]

  constructor(data: { year: number; days: StudentDailyActivityItemDto[] }) {
    this.year = data.year
    this.days = data.days
    this.totalCompetitionSubmits = data.days.reduce((sum, day) => sum + day.competitionSubmitCount, 0)
    this.totalExamAttempts = data.days.reduce((sum, day) => sum + day.examAttemptCount, 0)
    this.totalActivities = this.totalCompetitionSubmits + this.totalExamAttempts
    this.totalActiveDays = data.days.reduce((sum, day) => sum + (day.totalCount > 0 ? 1 : 0), 0)
    this.maxStreak = this.calculateMaxStreak(data.days)
  }

  private calculateMaxStreak(days: StudentDailyActivityItemDto[]): number {
    let maxStreak = 0
    let currentStreak = 0

    for (const day of days) {
      if (day.totalCount > 0) {
        currentStreak += 1
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak
        }
      } else {
        currentStreak = 0
      }
    }

    return maxStreak
  }
}

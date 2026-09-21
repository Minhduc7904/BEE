import type { ParentStudentSubmissionStatistics } from '../../interfaces'

export class ParentSubmissionStatisticsDto {
  totalSubmissions: number
  averageScore: number | null
  scoredSubmissions: number
  scoreScale: number

  static fromResult(result: ParentStudentSubmissionStatistics): ParentSubmissionStatisticsDto {
    return {
      ...result,
      scoreScale: 10,
    }
  }
}

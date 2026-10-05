import type { ParentResultsSummary } from '../../interfaces'
import { ParentLatestResultDto } from './parent-latest-result.dto'

export class ParentResultsSummaryDto {
  month: number
  year: number
  totalResults: number
  scoredResults: number
  averageScore: number | null
  scoreScale: number
  latestResult: ParentLatestResultDto | null

  static fromResult(result: ParentResultsSummary): ParentResultsSummaryDto {
    return {
      month: result.month,
      year: result.year,
      totalResults: result.totalResults,
      scoredResults: result.scoredResults,
      averageScore: result.averageScore,
      scoreScale: 10,
      latestResult: result.latestResult ? ParentLatestResultDto.fromResult(result.latestResult) : null,
    }
  }
}

import type { ParentMonthlyResultItem } from '../../interfaces'
import type { ParentResultType } from '../../../shared/enums/parent-result-type.enum'

export class ParentLatestResultDto {
  type: ParentResultType
  resultId: number
  title: string
  submittedAt: string
  points: number | null
  maxPoints: number | null

  static fromResult(result: ParentMonthlyResultItem): ParentLatestResultDto {
    return {
      type: result.type,
      resultId: result.resultId,
      title: result.title,
      submittedAt: result.submittedAt.toISOString(),
      points: result.points,
      maxPoints: result.maxPoints,
    }
  }
}

import type { ParentMonthlyResultItem, ParentResultsSummary } from '../../interfaces'
import { ParentResultType } from '../../../shared/enums/parent-result-type.enum'

const AVERAGE_SCORE_SCALE = 10

/** Newest submission first; ties prefer HOMEWORK, then the larger resultId, so the latest result is stable. */
function compareNewestFirst(left: ParentMonthlyResultItem, right: ParentMonthlyResultItem): number {
  return (
    right.submittedAt.getTime() - left.submittedAt.getTime() ||
    Number(right.type === ParentResultType.HOMEWORK) - Number(left.type === ParentResultType.HOMEWORK) ||
    right.resultId - left.resultId
  )
}

export function summarizeMonthlyResults(
  month: number,
  year: number,
  items: ParentMonthlyResultItem[],
): ParentResultsSummary {
  const scores = items
    .filter((item) => item.points !== null && item.maxPoints === AVERAGE_SCORE_SCALE)
    .map((item) => item.points as number)
  const sum = scores.reduce((total, value) => total + value, 0)

  return {
    month,
    year,
    totalResults: items.length,
    scoredResults: scores.length,
    averageScore: scores.length ? Math.round((sum / scores.length) * 100) / 100 : null,
    latestResult: [...items].sort(compareNewestFirst)[0] ?? null,
  }
}

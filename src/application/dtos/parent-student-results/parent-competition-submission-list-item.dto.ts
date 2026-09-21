import type { ParentCompetitionSubmissionListItem } from '../../interfaces'

export class ParentCompetitionSubmissionListItemDto {
  competitionSubmitId: number
  title: string
  submittedAt: Date | null
  points: number | null
  maxPoints: number | null

  static fromResult(result: ParentCompetitionSubmissionListItem): ParentCompetitionSubmissionListItemDto {
    return { ...result }
  }
}

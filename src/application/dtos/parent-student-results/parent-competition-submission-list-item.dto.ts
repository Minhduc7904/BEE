import type { ParentCompetitionSubmissionListItem } from '../../interfaces'
import { CompetitionSubmitStatus } from '../../../shared/enums'

export class ParentCompetitionSubmissionListItemDto {
  competitionSubmitId: number
  title: string
  attemptNumber: number
  status: CompetitionSubmitStatus
  submittedAt: Date | null
  gradedAt: Date | null
  points: number | null
  maxPoints: number | null
  feedback: string | null

  static fromResult(result: ParentCompetitionSubmissionListItem): ParentCompetitionSubmissionListItemDto {
    return { ...result }
  }
}

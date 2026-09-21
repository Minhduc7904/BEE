import type { ParentCompetitionSubmissionDetail } from '../../interfaces'
import { ParentSubmissionSectionScoreDto } from './parent-submission-section-score.dto'

export class ParentCompetitionSubmissionDetailDto {
  competitionSubmitId: number
  studentId: number
  title: string
  attemptNumber: number
  submittedAt: Date | null
  gradedAt: Date | null
  points: number | null
  maxPoints: number | null
  feedback: string | null
  sectionScores: ParentSubmissionSectionScoreDto[]

  static fromResult(result: ParentCompetitionSubmissionDetail): ParentCompetitionSubmissionDetailDto {
    return {
      ...result,
      sectionScores: result.sectionScores.map(ParentSubmissionSectionScoreDto.fromResult),
    }
  }
}

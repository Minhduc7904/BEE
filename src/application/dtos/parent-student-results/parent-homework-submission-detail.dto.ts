import type { ParentHomeworkSubmissionDetail } from '../../interfaces'
import { ParentSubmissionSectionScoreDto } from './parent-submission-section-score.dto'

export class ParentHomeworkSubmissionDetailDto {
  homeworkSubmitId: number
  studentId: number
  title: string
  submittedAt: Date
  gradedAt: Date | null
  points: number | null
  maxPoints: number | null
  feedback: string | null
  sectionScores: ParentSubmissionSectionScoreDto[]

  static fromResult(result: ParentHomeworkSubmissionDetail): ParentHomeworkSubmissionDetailDto {
    return {
      ...result,
      sectionScores: result.sectionScores.map(ParentSubmissionSectionScoreDto.fromResult),
    }
  }
}

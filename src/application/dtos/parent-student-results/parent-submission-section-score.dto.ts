import type { ParentSubmissionSectionScore } from '../../interfaces'

export class ParentSubmissionSectionScoreDto {
  sectionId: number | null
  title: string
  order: number | null
  points: number
  maxPoints: number

  static fromResult(result: ParentSubmissionSectionScore): ParentSubmissionSectionScoreDto {
    return { ...result }
  }
}

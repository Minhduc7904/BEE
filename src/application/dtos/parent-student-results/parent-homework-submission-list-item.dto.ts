import type { ParentHomeworkSubmissionListItem } from '../../interfaces'

export class ParentHomeworkSubmissionListItemDto {
  homeworkSubmitId: number
  title: string
  submittedAt: Date
  points: number | null
  maxPoints: number | null

  static fromResult(result: ParentHomeworkSubmissionListItem): ParentHomeworkSubmissionListItemDto {
    return { ...result }
  }
}

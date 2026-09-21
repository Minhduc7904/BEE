import type { ParentHomeworkSubmissionListItem } from '../../interfaces'
import { HomeworkContentType } from '../../../shared/enums'

export class ParentHomeworkSubmissionListItemDto {
  homeworkSubmitId: number
  title: string
  homeworkType: HomeworkContentType
  submittedAt: Date
  gradedAt: Date | null
  points: number | null
  maxPoints: number | null
  feedback: string | null

  static fromResult(result: ParentHomeworkSubmissionListItem): ParentHomeworkSubmissionListItemDto {
    return { ...result }
  }
}

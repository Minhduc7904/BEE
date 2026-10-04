import type { ParentScheduleHomeworkSubmission } from '../../interfaces'

export class ParentScheduleHomeworkSubmissionDto {
  homeworkSubmitId: number
  points: number | null

  static fromResult(result: ParentScheduleHomeworkSubmission): ParentScheduleHomeworkSubmissionDto {
    return {
      homeworkSubmitId: result.homeworkSubmitId,
      points: result.points,
    }
  }
}

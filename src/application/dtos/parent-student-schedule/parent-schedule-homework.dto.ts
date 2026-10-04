import type { ParentScheduleHomework } from '../../interfaces'
import { ParentScheduleHomeworkSubmissionDto } from './parent-schedule-homework-submission.dto'

export class ParentScheduleHomeworkDto {
  homeworkId: number
  submission: ParentScheduleHomeworkSubmissionDto | null

  static fromResult(result: ParentScheduleHomework): ParentScheduleHomeworkDto {
    return {
      homeworkId: result.homeworkId,
      submission: result.submission ? ParentScheduleHomeworkSubmissionDto.fromResult(result.submission) : null,
    }
  }
}

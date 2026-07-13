import { AdminCompetitionSubmitDetailDto } from '../competition-submit/admin-competition-submit-detail.dto'
import { HomeworkSubmitResponseDto } from './homework-submit.dto'
import { MediaUsageResponseDto } from '../media-usage/media-usage-response.dto'
import { HomeworkContentType } from 'src/shared/enums'

export class AdminHomeworkSubmitDetailDto {
  type: HomeworkContentType
  homeworkSubmit: HomeworkSubmitResponseDto
  fileSubmission?: {
    attachments: MediaUsageResponseDto[]
  }
  competitionSubmission?: AdminCompetitionSubmitDetailDto | null
}

import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { CompetitionSubmitStatus } from '../../../shared/enums'

export class SubmittedCompetitionAttemptBasicDto {
  competitionSubmitId: number
  competitionId: number
  studentId: number
  attemptNumber: number
  status: CompetitionSubmitStatus
  startedAt: Date
  submittedAt?: Date
  timeSpentSeconds?: number
  totalPoints?: number
  maxPoints?: number

  static fromEntity(entity: CompetitionSubmit): SubmittedCompetitionAttemptBasicDto {
    const dto = new SubmittedCompetitionAttemptBasicDto()
    dto.competitionSubmitId = entity.competitionSubmitId
    dto.competitionId = entity.competitionId
    dto.studentId = entity.studentId
    dto.attemptNumber = entity.attemptNumber
    dto.status = entity.status
    dto.startedAt = entity.startedAt
    dto.submittedAt = entity.submittedAt ?? undefined
    dto.timeSpentSeconds = entity.timeSpentSeconds ?? undefined
    dto.totalPoints = entity.totalPoints ?? undefined
    dto.maxPoints = entity.maxPoints ?? undefined
    return dto
  }
}

export class SubmittedCompetitionAttemptsByStudentResponseDto {
  studentId: number
  total: number
  competitionSubmits: SubmittedCompetitionAttemptBasicDto[]
}

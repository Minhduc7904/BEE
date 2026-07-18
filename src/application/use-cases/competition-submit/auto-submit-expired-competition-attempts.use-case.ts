import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

type AutoSubmitReason = 'ATTEMPT_TIME_EXPIRED' | 'COMPETITION_ENDED'

interface AutoSubmitResultItem {
  competitionSubmitId: number
  studentId: number
  reason: AutoSubmitReason
}

@Injectable()
export class AutoSubmitExpiredCompetitionAttemptsUseCase {
  constructor(
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
  ) {}

  async execute(now = new Date()): Promise<BaseResponseDto<any>> {
    const inProgressSubmits = await this.competitionSubmitRepository.findAllInProgressWithCompetition()

    const candidates = inProgressSubmits
      .map((submit) => ({ submit, reason: this.getExpiryReason(submit, now) }))
      .filter(
        (candidate): candidate is { submit: CompetitionSubmit; reason: AutoSubmitReason } =>
          candidate.reason !== null,
      )

    const submitted: AutoSubmitResultItem[] = []
    const failed: Array<AutoSubmitResultItem & { reasonMessage: string }> = []

    for (const { submit, reason } of candidates) {
      const item = {
        competitionSubmitId: submit.competitionSubmitId,
        studentId: submit.studentId,
        reason,
      }

      try {
        await this.competitionSubmitRepository.update(submit.competitionSubmitId, {
          status: CompetitionSubmitStatus.SUBMITTED,
        })
        submitted.push(item)
      } catch (error) {
        failed.push({
          ...item,
          reasonMessage: error instanceof Error ? error.message : 'Không thể tự động nộp bài',
        })
      }
    }

    return BaseResponseDto.success('Đã chuyển trạng thái SUBMITTED cho các lượt thi quá hạn', {
      checkedAt: now.toISOString(),
      inProgressCount: inProgressSubmits.length,
      eligibleCount: candidates.length,
      submittedCount: submitted.length,
      failedCount: failed.length,
      submitted,
      failed,
    })
  }

  private getExpiryReason(submit: CompetitionSubmit, now: Date): AutoSubmitReason | null {
    const competition = submit.competition
    if (!competition) return null

    if (competition.endDate && now > competition.endDate) {
      return 'COMPETITION_ENDED'
    }

    const durationMinutes = competition.durationMinutes
    if (durationMinutes === null || durationMinutes === undefined || durationMinutes <= 0) {
      return null
    }

    const expiresAt = new Date(submit.startedAt).getTime() + durationMinutes * 60 * 1000
    return now.getTime() >= expiresAt ? 'ATTEMPT_TIME_EXPIRED' : null
  }
}

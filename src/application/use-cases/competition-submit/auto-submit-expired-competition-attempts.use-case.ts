import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { FinishCompetitionSubmitUseCase } from './finish-competition-submit.use-case'

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
    private readonly finishCompetitionSubmitUseCase: FinishCompetitionSubmitUseCase,
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
    const skipped: Array<AutoSubmitResultItem & { reasonMessage: string }> = []
    const failed: Array<AutoSubmitResultItem & { reasonMessage: string }> = []

    for (const { submit, reason } of candidates) {
      const item = {
        competitionSubmitId: submit.competitionSubmitId,
        studentId: submit.studentId,
        reason,
      }

      try {
        const result = await this.finishCompetitionSubmitUseCase.execute(
          submit.competitionSubmitId,
          submit.studentId,
        )

        if (result.success) {
          submitted.push(item)
        } else {
          skipped.push({ ...item, reasonMessage: result.message })
        }
      } catch (error) {
        failed.push({
          ...item,
          reasonMessage: error instanceof Error ? error.message : 'Không thể tự động nộp bài',
        })
      }
    }

    return BaseResponseDto.success('Đã kiểm tra và tự động nộp các bài thi quá hạn', {
      checkedAt: now.toISOString(),
      inProgressCount: inProgressSubmits.length,
      eligibleCount: candidates.length,
      submittedCount: submitted.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      submitted,
      skipped,
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

// src/application/use-cases/competition-submit/get-competition-remaining-time.use-case.ts

import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CompetitionSubmitRemainingTimeDto } from '../../dtos/competition-submit/competition-submit-remaining-time.dto'
import { NotFoundException, ValidationException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetCompetitionRemainingTimeUseCase {
  constructor(
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
  ) {}

  async execute(competitionSubmitId: number): Promise<BaseResponseDto<CompetitionSubmitRemainingTimeDto>> {
    const competitionSubmit = await this.competitionSubmitRepository.findById(competitionSubmitId)

    if (!competitionSubmit) {
      throw new NotFoundException(`Competition submit với ID ${competitionSubmitId} không tồn tại`)
    }

    if (!competitionSubmit.competition) {
      throw new ValidationException(`Competition submit ${competitionSubmitId} không có thông tin cuộc thi`)
    }

    if (!competitionSubmit.startedAt) {
      throw new ValidationException(`Competition submit ${competitionSubmitId} chưa được bắt đầu`)
    }

    const now = new Date()
    const startedAt = competitionSubmit.startedAt

    // ===============================
    // TIME CALCULATION (MS BASED)
    // ===============================

    const elapsedMs = now.getTime() - startedAt.getTime()
    const elapsedMinutes = Math.floor(elapsedMs / 60000)

    const durationMinutes = competitionSubmit.competition.durationMinutes

    let remainingMs: number | undefined
    let remainingMinutes: number | undefined
    let isOverTime = false

    if (durationMinutes !== null && durationMinutes !== undefined) {
      const durationMs = durationMinutes * 60 * 1000

      remainingMs = Math.max(0, durationMs - elapsedMs)
      remainingMinutes = Math.floor(remainingMs / 60000)

      isOverTime = elapsedMs > durationMs
    }

    // ===============================
    // FORMAT FROM MILLISECONDS
    // ===============================

    const formatFromMs = (ms: number): string => {
      const totalSeconds = Math.floor(ms / 1000)

      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      }

      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const formattedElapsed = formatFromMs(elapsedMs)

    const formattedRemaining = remainingMs !== undefined ? formatFromMs(remainingMs) : '∞'

    const result = new CompetitionSubmitRemainingTimeDto(
      competitionSubmitId,
      durationMinutes ?? undefined,
      elapsedMinutes,
      remainingMinutes,
      isOverTime,
      formattedRemaining,
      formattedElapsed,
    )

    return BaseResponseDto.success('Lấy thông tin thời gian còn lại thành công', result)
  }
}
